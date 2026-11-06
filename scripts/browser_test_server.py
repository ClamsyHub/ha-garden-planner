"""Loopback-only browser test bridge to real PlannerService and temporary SQLite.

Not an HA authentication implementation. Never shipped inside the integration.
Every browser session has synthetic actors and its own temporary directory.
"""

import asyncio
import json
import re
import signal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from custom_components.garden_planner.models import PlannerError, ValidationError
from custom_components.garden_planner.options import validate_options
from custom_components.garden_planner.service import Actor, PlannerService
from custom_components.garden_planner.storage import PlannerWorker


async def seed(service: PlannerService) -> None:
    """Synthetic fixtures, never horticultural recommendations or real user data."""
    actor = Actor("test-admin", is_admin=True)

    async def create(table: str, data: dict[str, Any]) -> Any:
        return await service.async_execute(
            "create", {"table": table, "data": data}, actor
        )

    location = await create(
        "locations",
        {
            "name": "Hochbeet · Beispiel",
            "location_type": "Hochbeet",
            "light": "Sonnig",
            "description": "Synthetischer Teststandort",
        },
    )
    plants = []
    for name, category in [
        ("Blattkultur · Beispiel", "vegetables"),
        ("Kräuterkultur · Beispiel", "herbs"),
        ("Blütenkultur · Beispiel", "flowers"),
    ]:
        plants.append(
            await create(
                "plants",
                {
                    "name": name,
                    "category": category,
                    "notes": "Synthetische Testdaten, keine Anbauempfehlung.",
                },
            )
        )
    for index, activity in enumerate(["direct", "indoors", "transplant", "harvest"]):
        await create(
            "growing_windows",
            {
                "plant_id": plants[index % 3]["id"],
                "activity": activity,
                "environment": "greenhouse" if index == 0 else "outdoors",
                "start_month": 11 if index == 0 else 3 + index,
                "start_day": 1,
                "end_month": 2 if index == 0 else 7 + index,
                "end_day": 20,
                "source": "Synthetisches Testfenster; keine Empfehlung",
            },
        )
    for year, result in [(2025, "partial"), (2026, "successful"), (2027, "unknown")]:
        culture = await create(
            "cultivations",
            {
                "plant_id": plants[0]["id"],
                "location_id": location["id"],
                "date": f"{year}-09-05",
                "method": "direct",
                "result": result,
                "notes": f"Beobachtung im Testjahr {year}",
            },
        )
        await create(
            "cultivation_events",
            {
                "cultivation_id": culture["id"],
                "date": f"{year}-09-12",
                "status": "germinated",
                "notes": "Dokumentierte Testbeobachtung",
            },
        )
    await create(
        "tasks",
        {
            "title": "Beet kontrollieren · Beispiel",
            "date": "2026-11-07",
            "activity": "care",
            "location_id": location["id"],
        },
    )


async def main() -> None:
    sessions: dict[str, tuple[TemporaryDirectory[str], PlannerService]] = {}
    locks: dict[str, asyncio.Lock] = {}
    loop = asyncio.get_running_loop()
    stop = asyncio.Event()

    async def request(session: str, body: dict[str, Any]) -> Any:
        async with locks.setdefault(session, asyncio.Lock()):
            if session not in sessions:
                if len(sessions) >= 100:
                    raise ValueError("Too many test sessions")
                directory = TemporaryDirectory(prefix="garden-planner-browser-")
                worker = PlannerWorker(Path(directory.name))
                await worker.async_open()
                service = PlannerService(worker)
                if body.get("host"):
                    settings_state = validate_options({})

                    async def test_host(
                        operation: str, parameters: dict[str, Any], actor: Actor
                    ) -> Any:
                        nonlocal settings_state
                        if operation == "capabilities":
                            return {"reminders": True, "http_transfer": False}
                        if operation == "get_settings":
                            return {
                                "settings": settings_state,
                                "users": [
                                    {"id": "test-admin", "name": "Test admin"},
                                    {"id": "test-reader", "name": "Test reader"},
                                ],
                                "channels": [
                                    "notify.test_local",
                                    "notify.send_message",
                                ],
                            }
                        if parameters.get("confirm") is not True:
                            raise ValidationError("Confirmation required")
                        settings_state = validate_options(parameters["settings"])
                        service.writers = frozenset(settings_state["writers"])
                        return settings_state

                    service.host_handler = test_host
                sessions[session] = (directory, service)
                if body.get("demo"):
                    await seed(service)
            service = sessions[session][1]
            actor = Actor(
                "test-" + str(body.get("role", "admin")),
                is_admin=body.get("role") != "reader",
            )
            return await service.async_execute(
                body["operation"], body.get("parameters", {}), actor
            )

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, format: str, *args: Any) -> None:
            pass

        def do_GET(self) -> None:
            self.send_response(200 if self.path == "/health" else 404)
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_POST(self) -> None:
            if not re.fullmatch(r"/__test_api/[a-zA-Z0-9_-]{1,80}", self.path):
                self.send_error(404)
                return
            origin = self.headers.get("Origin")
            if origin not in {None, "http://127.0.0.1:5173"}:
                self.send_error(403)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length > 21 * 1024 * 1024:
                    raise ValueError("Too large")
                body = json.loads(self.rfile.read(length))
                future = asyncio.run_coroutine_threadsafe(
                    request(self.path.rsplit("/", 1)[1], body), loop
                )
                result = future.result(timeout=30)
                status = 200
            except PlannerError as error:
                result, status = {"code": error.code}, 400
            except (ValueError, KeyError, TimeoutError):
                result, status = {"code": "invalid_data"}, 400
            output = json.dumps(result, ensure_ascii=False).encode()
            try:
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(output)))
                self.end_headers()
                self.wfile.write(output)
            except (BrokenPipeError, ConnectionResetError):
                # Navigation/closed tabs cancel outstanding fetches during tests.
                # The operation already completed; never retry a write here.
                return

    class TestServer(ThreadingHTTPServer):
        request_queue_size = 128

    server = TestServer(("127.0.0.1", 8766), Handler)
    server.daemon_threads = True
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    task = asyncio.create_task(asyncio.to_thread(server.serve_forever))
    try:
        await stop.wait()
    finally:
        await asyncio.to_thread(server.shutdown)
        server.server_close()
        await task
        for directory, service in sessions.values():
            await service.worker.async_close()
            directory.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
