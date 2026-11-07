"""Real HA HTTP app, calendar entities, options, sensors and durable reminders."""

import io
import json
import unittest
from collections.abc import Awaitable, Callable
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from homeassistant.auth import auth_manager_from_config
from homeassistant.components.frontend import DATA_PANELS
from homeassistant.components.http.const import KEY_HASS_USER
from homeassistant.core import ServiceCall
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.http import KEY_AUTHENTICATED, KEY_HASS

from custom_components.garden_planner.calendar import GardenCalendar
from custom_components.garden_planner.config_flow import GardenOptionsFlow
from custom_components.garden_planner.const import DOMAIN
from custom_components.garden_planner.options import DEFAULT_OPTIONS
from custom_components.garden_planner.reminders import candidates
from custom_components.garden_planner.sensor import GardenCount
from custom_components.garden_planner.storage import PlannerWorker
from ha_tests.test_integration import IntegrationHarness


class FeatureTests(IntegrationHarness):
    """Platform forwarding is covered separately in the official Docker image."""

    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()
        dr.async_setup(self.hass)
        await dr.async_load(self.hass, load_empty=True)
        await er.async_load(self.hass, load_empty=True)
        self.hass.auth = await auth_manager_from_config(self.hass, [], [])
        self.owner = await self.hass.auth.async_create_user("Synthetic owner")
        self.editor = await self.hass.auth.async_create_user("Synthetic editor")
        self.hass.config_entries._entries[self.entry.entry_id] = self.entry
        self.hass.http.app[KEY_HASS] = self.hass
        self.delivered: list[str] = []

        async def notify(call: ServiceCall) -> None:
            self.delivered.append(call.data["message"])

        self.hass.services.async_register("notify", "test_local", notify)

    async def test_panel_and_static_code_are_registered_automatically(self) -> None:
        panels = self.hass.data[DATA_PANELS]
        self.assertIn("garden-planner", panels)
        config = panels["garden-planner"].config
        assert config is not None
        self.assertIn("garden-planner.js?v=", config["_panel_custom"]["module_url"])
        client = TestClient(TestServer(self.hass.http.app))
        await client.start_server()
        try:
            response = await client.get("/garden_planner_static/garden-planner.js")
            self.assertEqual(response.status, 200)
            self.assertIn("garden-planner-panel", await response.text())
            response = await client.get(
                "/garden_planner_static/../garden_planner.sqlite3"
            )
            self.assertNotEqual(response.status, 200)
        finally:
            await client.close()

    async def test_http_auth_and_large_file_transport(self) -> None:
        @web.middleware
        async def auth(
            request: web.Request,
            handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
        ) -> web.StreamResponse:
            who = request.headers.get("X-Test-User")
            if who:
                request[KEY_AUTHENTICATED] = True
                request[KEY_HASS_USER] = self.owner if who == "owner" else self.editor
            return await handler(request)

        self.hass.http.app.middlewares.append(auth)
        client = TestClient(TestServer(self.hass.http.app))
        await client.start_server()
        try:
            url = "/api/garden_planner/exchange"
            response = await client.post(url, json={"operation": "export"})
            self.assertEqual(response.status, 401)
            response = await client.post(
                url, headers={"X-Test-User": "reader"}, json={"operation": "export"}
            )
            self.assertEqual(response.status, 400)
            self.assertEqual((await response.json())["code"], "unauthorized")
            response = await client.post(
                url,
                headers={"X-Test-User": "reader"},
                json={"operation": "list", "parameters": {"table": "plants"}},
            )
            self.assertEqual(response.status, 200)
            # Exceeds HA's 16MiB read() limit; our transport still bounds it.
            large = io.BytesIO(
                json.dumps(
                    {
                        "operation": "preview_import",
                        "parameters": {"payload": "x" * (17 * 1024 * 1024)},
                    }
                ).encode()
            )
            response = await client.post(
                url,
                headers={"X-Test-User": "owner", "Content-Type": "application/json"},
                data=large,
            )
            self.assertEqual(response.status, 400)
            self.assertEqual((await response.json())["code"], "invalid_data")
            response = await client.post(
                url, headers={"X-Test-User": "owner"}, json={"operation": "export"}
            )
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
            self.assertIn("tables", await response.json())
        finally:
            await client.close()

    async def test_editor_grants_and_options_require_admin(self) -> None:
        response = await self.request("get_settings")
        self.assertFalse(response["result"]["settings"]["reminders_enabled"])
        settings = {**DEFAULT_OPTIONS, "writers": [self.editor.id]}
        response = await self.request(
            "set_settings", {"settings": settings, "confirm": True}
        )
        self.assertTrue(response["success"])
        self.connection.user = self.editor
        self.assertTrue((await self.request("capabilities"))["result"]["can_edit"])
        self.assertTrue(
            (
                await self.request(
                    "create", {"table": "plants", "data": {"name": "Granted crop"}}
                )
            )["success"]
        )
        self.assertEqual(
            (
                await self.request(
                    "set_settings", {"settings": settings, "confirm": True}
                )
            )["error"]["code"],
            "unauthorized",
        )
        self.assertEqual(
            (await self.request("backup"))["error"]["code"], "unauthorized"
        )

    async def test_user_routes_deliver_independently_and_deduplicate(self) -> None:
        user2 = await self.hass.auth.async_create_user("Synthetic two")
        user3 = await self.hass.auth.async_create_user("Synthetic three")
        calls: list[tuple[str, dict[str, Any]]] = []

        async def record(call: ServiceCall) -> None:
            calls.append((call.service, dict(call.data)))

        for name in ("push_one", "push_two", "push_three", "email", "send_message"):
            self.hass.services.async_register("notify", name, record)
        self.hass.states.async_set("notify.email_three", "unknown")

        def route(
            user_id: str, kind: str, service: str, entity: str = "", target: str = ""
        ) -> dict[str, Any]:
            return {
                "user_id": user_id,
                "kind": kind,
                "enabled": True,
                "service": service,
                "entity": entity,
                "target": target,
            }

        routes = [
            route(self.editor.id, "push", "notify.push_one"),
            route(user2.id, "push", "notify.push_two"),
            route(user3.id, "push", "notify.push_three"),
            route(
                self.editor.id, "email", "notify.email", target="one@example.invalid"
            ),
            route(
                user3.id, "email", "notify.send_message", entity="notify.email_three"
            ),
        ]
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Route test",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        response = await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "notification_routes": routes,
                },
                "confirm": True,
            },
        )
        self.assertTrue(response["success"], response)
        reminder = self.hass.data[f"{DOMAIN}_runtime"].reminders
        await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        await reminder.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(len(calls), 5)
        self.assertEqual(
            [data["target"] for service, data in calls if service == "email"],
            [["one@example.invalid"]],
        )
        self.assertEqual(
            [data["entity_id"] for service, data in calls if service == "send_message"],
            ["notify.email_three"],
        )
        # Overlapping recipients to the same destination never double-send.
        routes[1]["service"] = "notify.push_one"
        response = await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "notification_routes": routes,
                },
                "confirm": True,
            },
        )
        self.assertTrue(response["success"])
        await reminder.async_check(datetime(2026, 11, 6, 14, tzinfo=UTC))
        self.assertEqual(len(calls), 5)
        # A revoked user cannot read through the real websocket command boundary.
        response = await self.request(
            "set_settings",
            {"settings": {**DEFAULT_OPTIONS, "readers": []}, "confirm": True},
        )
        self.assertTrue(response["success"])
        self.connection.user = self.editor
        self.assertEqual(
            (await self.request("list", {"table": "plants"}))["error"]["code"],
            "unauthorized",
        )

    async def test_failed_route_does_not_block_healthy_route_or_retry(self) -> None:
        calls: list[str] = []

        async def failing(call: ServiceCall) -> None:
            calls.append("failed")
            raise RuntimeError("Synthetic route failure")

        async def healthy(call: ServiceCall) -> None:
            calls.append("healthy")

        self.hass.services.async_register("notify", "route_failing", failing)
        self.hass.services.async_register("notify", "route_healthy", healthy)
        user2 = await self.hass.auth.async_create_user("Synthetic healthy recipient")
        routes = [
            {
                "user_id": self.editor.id,
                "kind": "push",
                "enabled": True,
                "service": "notify.route_failing",
                "entity": "",
                "target": "",
            },
            {
                "user_id": user2.id,
                "kind": "push",
                "enabled": True,
                "service": "notify.route_healthy",
                "entity": "",
                "target": "",
            },
        ]
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Independent routes",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        response = await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "notification_routes": routes,
                },
                "confirm": True,
            },
        )
        self.assertTrue(response["success"], response)
        reminder = self.hass.data[f"{DOMAIN}_runtime"].reminders
        with self.assertLogs(
            "custom_components.garden_planner.reminders", level="ERROR"
        ):
            await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        await reminder.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(calls, ["failed", "healthy"])
        self.assertEqual(
            sorted(r["state"] for r in (await self.request("reminder_log"))["result"]),
            ["sent", "uncertain"],
        )

    async def test_native_options_form_and_validation(self) -> None:
        flow = GardenOptionsFlow()
        flow.hass = self.hass
        flow.handler = self.entry.entry_id
        self.assertEqual((await flow.async_step_init())["type"], "form")
        invalid = {
            **DEFAULT_OPTIONS,
            "reminders_enabled": True,
            "notify_service": "notify.missing",
        }
        self.assertEqual(
            (await flow.async_step_init(invalid))["errors"],
            {"base": "invalid_settings"},
        )
        result = await flow.async_step_init({**DEFAULT_OPTIONS, "lead_days": 7})
        self.assertEqual(result["type"], "create_entry")
        self.assertEqual(result["data"]["lead_days"], 7)

    async def test_aggregate_sensor_and_calendar_match_real_records(self) -> None:
        plant = (
            await self.request(
                "create", {"table": "plants", "data": {"name": "Observed crop"}}
            )
        )["result"]
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Check crop",
                    "date": "2026-12-31",
                    "activity": "care",
                },
            },
        )
        await self.request(
            "create",
            {
                "table": "cultivations",
                "data": {
                    "plant_id": plant["id"],
                    "date": "2027-01-01",
                    "method": "direct",
                },
            },
        )
        runtime = self.hass.data[f"{DOMAIN}_runtime"]
        await runtime.coordinator.async_refresh()
        sensor = GardenCount(runtime.coordinator, self.entry, "plants")
        self.assertEqual(sensor.native_value, 1)
        calendar = GardenCalendar(runtime.coordinator, self.entry)
        events = await calendar.async_get_events(
            self.hass,
            datetime(2026, 12, 31, tzinfo=UTC),
            datetime(2027, 1, 2, tzinfo=UTC),
        )
        self.assertEqual(len(events), 2)
        self.assertTrue(all(e.all_day for e in events))
        self.assertTrue(
            any(e.summary == "Check crop" and e.end == date(2027, 1, 1) for e in events)
        )

    async def test_reminders_default_off_and_persist_attempts_across_workers(
        self,
    ) -> None:
        runtime = self.hass.data[f"{DOMAIN}_runtime"]
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Synthetic reminder",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        instant = datetime(2026, 11, 6, 12, tzinfo=UTC)
        await runtime.reminders.async_check(instant)
        self.assertEqual(self.delivered, [])
        response = await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "notify_service": "notify.test_local",
                },
                "confirm": True,
            },
        )
        self.assertTrue(response["success"])
        await runtime.reminders.async_check(instant)
        await runtime.reminders.async_check(instant + timedelta(minutes=15))
        self.assertEqual(len(self.delivered), 1)
        other = PlannerWorker(Path(self.temp.name) / DOMAIN)
        await other.async_open()
        try:
            self.assertEqual(
                (await other.async_call("reminder_log"))[0]["state"], "sent"
            )
            self.assertFalse(
                await other.async_call(
                    "claim_reminder",
                    "task:"
                    + (
                        await runtime.service.worker.async_call("list_records", "tasks")
                    )[0]["id"]
                    + ":2026-11-06",
                    "Do not repeat",
                )
            )
        finally:
            await other.async_close()

    async def test_unknown_or_failed_channel_is_never_automatically_retried(
        self,
    ) -> None:
        attempts = []

        async def failing(call: ServiceCall) -> None:
            attempts.append(1)
            raise RuntimeError("Synthetic channel uncertainty")

        self.hass.services.async_register("notify", "failing", failing)
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Only once",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "notify_service": "notify.failing",
                },
                "confirm": True,
            },
        )
        reminder = self.hass.data[f"{DOMAIN}_runtime"].reminders
        with self.assertLogs(
            "custom_components.garden_planner.reminders", level="ERROR"
        ):
            await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        await reminder.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(attempts, [1])
        self.assertEqual(
            (await self.request("reminder_log"))["result"][0]["state"], "uncertain"
        )


if __name__ == "__main__":
    unittest.main()


class ReminderDateTests(unittest.TestCase):
    """Seasonal openings are dates, including winter and leap-year boundaries."""

    def test_window_opening_catchup_and_archive(self) -> None:
        data: dict[str, Any] = {
            "plants": [{"id": "p", "data": {"name": "Crop"}}],
            "growing_windows": [
                {
                    "id": "w",
                    "data": {
                        "plant_id": "p",
                        "activity": "direct",
                        "start_month": 12,
                        "start_day": 31,
                        "end_month": 2,
                        "end_day": 1,
                    },
                }
            ],
        }
        self.assertEqual(
            candidates(data, date(2027, 1, 1), 0, "en"),
            [("window:w:2026-12-31", "Crop: Direct sowing · 2026-12-31")],
        )
        self.assertEqual(candidates(data, date(2027, 1, 8), 0, "de"), [])
        data["plants"][0]["data"]["archived"] = True
        self.assertEqual(candidates(data, date(2027, 1, 1), 0, "de"), [])

    def test_leap_day_and_lead_time(self) -> None:
        data = {
            "growing_windows": [
                {
                    "id": "leap",
                    "data": {
                        "plant_id": "p",
                        "activity": "indoors",
                        "start_month": 2,
                        "start_day": 29,
                    },
                }
            ]
        }
        self.assertEqual(candidates(data, date(2027, 2, 28), 3, "de"), [])
        self.assertEqual(len(candidates(data, date(2028, 2, 27), 2, "de")), 1)
        self.assertEqual(candidates(data, date(2028, 2, 27), 1, "de"), [])
