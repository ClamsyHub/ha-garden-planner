"""Authorization, confirmation and exchange tests at the application boundary."""

import tempfile
import unittest
from pathlib import Path
from typing import Any

from custom_components.garden_planner.models import ConflictError, ValidationError
from custom_components.garden_planner.service import (
    Actor,
    AuthorizationError,
    PlannerService,
)
from custom_components.garden_planner.storage import PlannerWorker


class ServiceTests(unittest.IsolatedAsyncioTestCase):
    """Use real storage to verify denied actions do not mutate data."""

    async def asyncSetUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        worker = PlannerWorker(Path(self.temp.name))
        await worker.async_open()
        self.addAsyncCleanup(worker.async_close)
        self.service = PlannerService(worker, writers=frozenset({"editor"}))
        self.admin = Actor("admin", is_admin=True)
        self.reader = Actor("reader")
        self.editor = Actor("editor")

    async def call(
        self,
        operation: str,
        params: dict[str, Any] | None = None,
        actor: Actor | None = None,
    ) -> Any:
        return await self.service.async_execute(
            operation, params or {}, actor or self.admin
        )

    async def test_default_deny_writes_and_explicit_editor_grant(self) -> None:
        params = {"table": "plants", "data": {"name": "Shared"}}
        with self.assertRaises(AuthorizationError):
            await self.call("create", params, self.reader)
        plant = await self.call("create", params, self.editor)
        self.assertEqual(plant["data"]["name"], "Shared")
        with self.assertRaises(AuthorizationError):
            await self.call("backup", actor=self.editor)
        self.assertEqual((await self.call("summary", actor=self.reader))["plants"], 1)

    async def test_inactive_and_unauthenticated_users_denied(self) -> None:
        for actor in (Actor(""), Actor("inactive", is_admin=True, is_active=False)):
            with self.assertRaises(AuthorizationError):
                await self.call("summary", actor=actor)

    async def test_view_revocation_is_enforced_on_every_data_request(self) -> None:
        self.service.readers = frozenset({"reader", "editor"})
        self.assertEqual((await self.call("summary", actor=self.reader))["plants"], 0)
        self.service.readers = frozenset({"editor"})
        for operation, params in (
            ("summary", {}),
            ("list", {"table": "plants"}),
            ("capabilities", {}),
        ):
            with self.assertRaises(AuthorizationError):
                await self.call(operation, params, self.reader)
        self.assertEqual((await self.call("summary", actor=self.admin))["plants"], 0)

    async def test_payload_cannot_override_actor(self) -> None:
        with self.assertRaises(ValidationError):
            await self.call("summary", {"actor": {"is_admin": True}}, self.reader)
        invalid: list[dict[str, Any]] = [
            {"table": []},
            {"table": "plants", "filters": []},
        ]
        for params in invalid:
            with self.assertRaises(ValidationError):
                await self.call("list", params)

    async def test_confirmed_restore_requires_fresh_preview(self) -> None:
        plant = await self.call(
            "create", {"table": "plants", "data": {"name": "Before"}}
        )
        name = await self.call("backup")
        await self.call(
            "update",
            {
                "table": "plants",
                "id": plant["id"],
                "data": {"name": "After"},
                "revision": 1,
            },
        )
        preview = await self.call("preview_restore", {"name": name})
        with self.assertRaises(ValidationError):
            await self.call(
                "restore", {"name": name, "token": preview["token"], "confirm": False}
            )
        await self.call(
            "restore", {"name": name, "token": preview["token"], "confirm": True}
        )
        self.assertEqual(
            (await self.call("get", {"table": "plants", "id": plant["id"]}))["data"][
                "name"
            ],
            "Before",
        )
        with self.assertRaises(ConflictError):
            await self.call(
                "restore", {"name": name, "token": preview["token"], "confirm": True}
            )

    async def test_csv_service_and_non_destructive_merge(self) -> None:
        await self.call("create", {"table": "plants", "data": {"name": "Example"}})
        files = await self.call("export", {"format": "csv"})
        preview = await self.call("preview_import", {"payload": files, "format": "csv"})
        self.assertEqual(preview["skipped"], 1)
        await self.call(
            "import", {"payload": files, "format": "csv", "token": preview["token"]}
        )
        self.assertEqual((await self.call("summary"))["plants"], 1)
        with self.assertRaises(ValidationError):
            await self.call(
                "preview_import", {"payload": {"../escape.csv": "bad"}, "format": "csv"}
            )
        preview = await self.call(
            "preview_import", {"payload": files, "format": "csv", "mode": "replace"}
        )
        with self.assertRaises(ValidationError):
            await self.call(
                "import",
                {
                    "payload": files,
                    "format": "csv",
                    "mode": "replace",
                    "token": preview["token"],
                },
            )


if __name__ == "__main__":
    unittest.main()
