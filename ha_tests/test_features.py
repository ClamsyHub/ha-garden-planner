"""Real HA HTTP app, calendar entities, options, sensors and durable reminders."""

import asyncio
import hashlib
import io
import json
import unittest
from collections.abc import Awaitable, Callable
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from homeassistant.auth.const import GROUP_ID_ADMIN
from homeassistant.components.frontend import DATA_PANELS
from homeassistant.components.frontend.storage import UserStore, async_user_store
from homeassistant.components.http.const import KEY_HASS_USER
from homeassistant.core import ServiceCall
from homeassistant.helpers.http import KEY_AUTHENTICATED, KEY_HASS
from homeassistant.util.file import WriteError

from custom_components.garden_planner.calendar import GardenCalendar
from custom_components.garden_planner.config_flow import GardenOptionsFlow
from custom_components.garden_planner.const import DOMAIN
from custom_components.garden_planner.models import StorageError
from custom_components.garden_planner.options import DEFAULT_OPTIONS
from custom_components.garden_planner.personal_tasks import PersonalTasks
from custom_components.garden_planner.reminder_preferences import (
    STORE_KEY,
    availability,
    selections,
)
from custom_components.garden_planner.reminders import Reminders, candidates
from custom_components.garden_planner.runtime import Runtime
from custom_components.garden_planner.sensor import GardenCount
from custom_components.garden_planner.service import Actor, AuthorizationError
from custom_components.garden_planner.storage import PlannerWorker
from custom_components.garden_planner.task_planning import reconcile, visible
from ha_tests.test_integration import IntegrationHarness


class FeatureTests(IntegrationHarness):
    """Platform forwarding is covered separately in the official Docker image."""

    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()
        self.owner = await self.hass.auth.async_create_user("Synthetic owner")
        self.editor = await self.hass.auth.async_create_user("Synthetic editor")
        self.hass.config_entries._entries[self.entry.entry_id] = self.entry
        self.hass.http.app[KEY_HASS] = self.hass
        self.delivered: list[str] = []

        async def notify(call: ServiceCall) -> None:
            self.delivered.append(call.data["message"])

        self.hass.services.async_register("notify", "test_local", notify)

    async def test_sidebar_revocation_restores_only_our_link_and_keeps_admin_access(
        self,
    ) -> None:
        outsider = await self.hass.auth.async_create_user("Synthetic outsider")
        editor_store = await async_user_store(self.hass, self.editor.id)
        outsider_store = await async_user_store(self.hass, outsider.id)
        owner_store = await async_user_store(self.hass, self.owner.id)
        original = {
            "hiddenPanels": ["map"],
            "panelOrder": ["history", "map"],
            "other": True,
        }
        await editor_store.async_set_item("sidebar", original)
        await outsider_store.async_set_item(
            "sidebar", {"hiddenPanels": ["garden-planner", "map"]}
        )
        changes: list[bool] = []
        unsubscribe = editor_store.async_subscribe(
            "sidebar", lambda: changes.append(True)
        )
        self.addCleanup(unsubscribe)

        result = await self.request(
            "set_settings",
            {"settings": {**DEFAULT_OPTIONS, "readers": []}, "confirm": True},
        )
        self.assertTrue(result["success"])
        self.assertEqual(
            editor_store.data["sidebar"],
            {**original, "hiddenPanels": ["map", "garden-planner"]},
        )
        self.assertNotIn(
            "garden-planner",
            owner_store.data.get("sidebar", {}).get("hiddenPanels", []),
        )
        self.assertTrue(self.hass.data[DATA_PANELS]["garden-planner"].require_admin)
        service = self.hass.data[DOMAIN]
        with self.assertRaises(AuthorizationError):
            await service.async_execute(
                "list", {"table": "plants"}, Actor(self.editor.id)
            )
        await service.async_execute(
            "list", {"table": "plants"}, Actor(self.owner.id, is_admin=True)
        )
        self.assertTrue(changes)

        result = await self.request(
            "set_settings",
            {
                "settings": {**DEFAULT_OPTIONS, "readers": [self.editor.id]},
                "confirm": True,
            },
        )
        self.assertTrue(result["success"])
        self.assertEqual(editor_store.data["sidebar"], original)
        self.assertEqual(
            outsider_store.data["sidebar"]["hiddenPanels"], ["garden-planner", "map"]
        )
        self.assertFalse(self.hass.data[DATA_PANELS]["garden-planner"].require_admin)
        await service.async_execute("list", {"table": "plants"}, Actor(self.editor.id))
        with self.assertRaises(AuthorizationError):
            await service.async_execute("list", {"table": "plants"}, Actor(outsider.id))

        # Selecting only administrators is also an administrator-only panel.
        result = await self.request(
            "set_settings",
            {
                "settings": {**DEFAULT_OPTIONS, "readers": [self.owner.id]},
                "confirm": True,
            },
        )
        self.assertTrue(result["success"])
        self.assertTrue(self.hass.data[DATA_PANELS]["garden-planner"].require_admin)

        # Returning to unrestricted viewing also restores only integration-owned hides.
        await self.request(
            "set_settings",
            {"settings": {**DEFAULT_OPTIONS, "readers": []}, "confirm": True},
        )
        await self.request(
            "set_settings", {"settings": DEFAULT_OPTIONS, "confirm": True}
        )
        self.assertEqual(editor_store.data["sidebar"], original)
        self.assertIn("garden-planner", outsider_store.data["sidebar"]["hiddenPanels"])

    async def test_sidebar_tracks_new_users_and_administrator_promotion(self) -> None:
        result = await self.request(
            "set_settings",
            {
                "settings": {**DEFAULT_OPTIONS, "readers": [self.editor.id]},
                "confirm": True,
            },
        )
        self.assertTrue(result["success"])
        late = await self.hass.auth.async_create_user("Synthetic later user")
        await self.hass.async_block_till_done(wait_background_tasks=True)
        store = await async_user_store(self.hass, late.id)
        self.assertIn("garden-planner", store.data["sidebar"]["hiddenPanels"])
        await self.hass.auth.async_update_user(late, group_ids=[GROUP_ID_ADMIN])
        await self.hass.async_block_till_done(wait_background_tasks=True)
        self.assertTrue(late.is_admin)
        self.assertNotIn("garden-planner", store.data["sidebar"]["hiddenPanels"])

    async def test_batch_preferences_save_once_and_regenerate_once_for_reader(
        self,
    ) -> None:
        plant = (
            await self.request(
                "create", {"table": "plants", "data": {"name": "Batch plant"}}
            )
        )["result"]
        for activity in ("direct", "care"):
            response = await self.request(
                "create",
                {
                    "table": "growing_windows",
                    "data": {
                        "plant_id": plant["id"],
                        "activity": activity,
                        "environment": "outdoors",
                        "start_month": 11,
                        "start_day": 6,
                        "end_month": 11,
                        "end_day": 30,
                    },
                },
            )
            self.assertTrue(response["success"], response)
        self.connection.user = self.editor
        runtime: Runtime = self.hass.data[f"{DOMAIN}_runtime"]
        store = await async_user_store(self.hass, self.editor.id)
        changes = [
            {"plant_id": plant["id"], "activity": a, "enabled": False}
            for a in ("direct", "care")
        ]
        with (
            patch.object(store, "async_set_item", wraps=store.async_set_item) as save,
            patch.object(
                runtime.reminders.planner,
                "async_tasks",
                wraps=runtime.reminders.planner.async_tasks,
            ) as generate,
        ):
            response = await self.request("set_user_reminders", {"changes": changes})
            self.assertTrue(response["success"], response)
            self.assertEqual(
                response["result"]["cells"][plant["id"]],
                {"direct": False, "care": False},
            )
            self.assertEqual(save.await_count, 1)
            self.assertEqual(generate.await_count, 1)
            await self.request("get_user_reminders")
            self.assertEqual(generate.await_count, 1)
            invalid = changes + [
                {"plant_id": plant["id"], "activity": "missing", "enabled": True}
            ]
            self.assertFalse(
                (await self.request("set_user_reminders", {"changes": invalid}))[
                    "success"
                ]
            )
            self.assertFalse(
                (
                    await self.request(
                        "set_user_reminders",
                        {"changes": changes, "user_id": self.owner.id},
                    )
                )["success"]
            )
            self.assertEqual(save.await_count, 1)
            self.assertEqual(generate.await_count, 1)
        self.connection.user = self.owner
        result = (await self.request("get_user_reminders"))["result"]
        self.assertTrue(all(result["cells"][plant["id"]].values()))

    async def test_personal_reminders_owner_persistence_and_deduplication(
        self,
    ) -> None:
        plant = (
            await self.request(
                "create",
                {"table": "plants", "data": {"name": "Synthetic personal plant"}},
            )
        )["result"]
        window_data = {
            "plant_id": plant["id"],
            "activity": "direct",
            "environment": "outdoors",
            "start_month": 11,
            "start_day": 6,
            "end_month": 11,
            "end_day": 30,
        }
        window = (
            await self.request(
                "create", {"table": "growing_windows", "data": window_data}
            )
        )["result"]
        original_admin = self.connection.user
        self.connection.user = self.editor
        response = await self.request("get_user_reminders")
        self.assertTrue(response["result"]["cells"][plant["id"]]["direct"])
        response = await self.request(
            "set_user_reminder",
            {"plant_id": plant["id"], "activity": "direct", "enabled": False},
        )
        self.assertTrue(response["success"], response)
        self.assertFalse(response["result"]["cells"][plant["id"]]["direct"])
        self.assertFalse(
            (await self.request("get_user_reminders"))["result"]["cells"][plant["id"]][
                "direct"
            ]
        )
        self.assertFalse(
            (
                await self.request(
                    "set_user_reminder",
                    {"plant_id": plant["id"], "activity": "care", "enabled": False},
                )
            )["success"]
        )
        self.assertFalse(
            (
                await self.request(
                    "set_user_reminder",
                    {
                        "plant_id": plant["id"],
                        "activity": "direct",
                        "enabled": True,
                        "user_id": self.owner.id,
                    },
                )
            )["success"]
        )
        self.assertFalse(
            (
                await self.request(
                    "create", {"table": "plants", "data": {"name": "Forbidden"}}
                )
            )["success"]
        )
        store = await async_user_store(self.hass, self.editor.id)
        self.assertIn(STORE_KEY, store.data)
        restored_store = UserStore(self.hass, self.editor.id)
        await restored_store.async_load()
        self.assertEqual(restored_store.data[STORE_KEY], store.data[STORE_KEY])
        self.connection.user = self.owner
        self.assertTrue(
            (await self.request("get_user_reminders"))["result"]["cells"][plant["id"]][
                "direct"
            ]
        )
        routes = [
            {
                "user_id": user.id,
                "kind": "push",
                "enabled": True,
                "service": "notify.test_local",
                "entity": "",
                "target": "",
            }
            for user in (self.editor, self.owner)
        ]
        result = await self.request(
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
        self.assertTrue(result["success"], result)
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
        # First route opted out; the second identical destination still delivers.
        await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 1)
        await reminder.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 1)
        await self.request(
            "set_user_reminder",
            {"plant_id": plant["id"], "activity": "direct", "enabled": False},
        )
        second = (
            await self.request(
                "create", {"table": "growing_windows", "data": window_data}
            )
        )["result"]
        await reminder.async_check(datetime(2026, 11, 6, 14, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 1)
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Manual task unaffected",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        await reminder.async_check(datetime(2026, 11, 6, 15, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 2)
        for record in (window, second):
            result = await self.request(
                "delete",
                {
                    "table": "growing_windows",
                    "id": record["id"],
                    "revision": record["revision"],
                    "confirm": True,
                },
            )
            self.assertTrue(result["success"], result)
        await self.request("create", {"table": "growing_windows", "data": window_data})
        self.assertTrue(
            (await self.request("get_user_reminders"))["result"]["cells"][plant["id"]][
                "direct"
            ]
        )
        self.connection.user = original_admin
        await self.request(
            "set_settings",
            {"settings": {**DEFAULT_OPTIONS, "readers": []}, "confirm": True},
        )
        self.connection.user = self.editor
        self.assertFalse((await self.request("get_user_reminders"))["success"])
        self.assertFalse(
            (
                await self.request(
                    "set_user_reminder",
                    {"plant_id": plant["id"], "activity": "direct", "enabled": True},
                )
            )["success"]
        )
        self.connection.user = original_admin

    async def test_generated_tasks_are_private_completable_and_notify_through_tasks(
        self,
    ) -> None:
        plant = (
            await self.request(
                "create",
                {"table": "plants", "data": {"name": "Synthetic planned crop"}},
            )
        )["result"]
        window = (
            await self.request(
                "create",
                {
                    "table": "growing_windows",
                    "data": {
                        "plant_id": plant["id"],
                        "activity": "care",
                        "environment": "outdoors",
                        "start_month": 11,
                        "start_day": 6,
                        "end_month": 11,
                        "end_day": 30,
                    },
                },
            )
        )["result"]
        runtime: Runtime = self.hass.data[f"{DOMAIN}_runtime"]
        await runtime.reminders.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        self.assertEqual(self.delivered, [])
        # Timer planning runs even while notifications are globally off.
        self.assertIn(self.owner.id, runtime.reminders.planner.records)
        original = self.connection.user
        self.connection.user = self.owner
        own = (await self.request("list", {"table": "tasks"}))["result"]
        task = next(r for r in own if r["data"]["date"] == "2026-11-06")
        self.assertTrue(task["data"]["personal_generated"])
        self.assertEqual(
            (await self.request("get", {"table": "tasks", "id": task["id"]}))["result"][
                "id"
            ],
            task["id"],
        )
        self.connection.user = self.editor
        self.assertFalse(
            (await self.request("get", {"table": "tasks", "id": task["id"]}))["success"]
        )
        self.assertFalse(
            (
                await self.request(
                    "set_personal_task_completed",
                    {"id": task["id"], "revision": task["revision"], "completed": True},
                )
            )["success"]
        )
        editor_tasks = (await self.request("list", {"table": "tasks"}))["result"]
        editor_task = next(r for r in editor_tasks if r["data"]["date"] == "2026-11-06")
        completed = await self.request(
            "set_personal_task_completed",
            {
                "id": editor_task["id"],
                "revision": editor_task["revision"],
                "completed": True,
            },
        )
        self.assertTrue(completed["success"], completed)
        self.assertFalse(
            (
                await self.request(
                    "update",
                    {
                        "table": "tasks",
                        "id": editor_task["id"],
                        "revision": editor_task["revision"],
                        "data": {"completed": False},
                    },
                )
            )["success"]
        )
        reloaded = PersonalTasks(self.hass, self.hass.data[DOMAIN].worker)
        again = await reloaded.async_tasks(self.editor.id, date(2026, 11, 6), "de")
        self.assertTrue(
            next(r for r in again if r["id"] == editor_task["id"])["data"]["completed"]
        )
        await runtime.coordinator.async_refresh()
        self.assertEqual(runtime.coordinator.data["tasks"], [])
        # Existing notifications deliver the pending task, not the completed one.
        self.connection.user = self.owner
        routes = [
            {
                "user_id": user.id,
                "kind": "push",
                "enabled": True,
                "service": "notify.test_local",
                "entity": "",
                "target": "",
            }
            for user in (self.editor, self.owner)
        ]
        routes.append(
            {
                "user_id": self.owner.id,
                "kind": "email",
                "enabled": True,
                "service": "notify.test_local",
                "entity": "",
                "target": "synthetic@example.invalid",
            }
        )
        result = await self.request(
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
        self.assertTrue(result["success"], result)
        await runtime.reminders.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 2)
        await runtime.reminders.async_check(datetime(2026, 11, 6, 14, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 2)
        # Keep existing window reservations to prevent upgrade duplicates.
        key = f"window:{window['id']}:2026-11-06"
        self.assertFalse(
            await self.hass.data[DOMAIN].worker.async_call(
                "claim_reminder",
                key
                + ":route:"
                + hashlib.sha256(
                    json.dumps(["notify.test_local", "", ""]).encode()
                ).hexdigest()[:24],
                "compatibility",
            )
        )
        latest = (await self.request("get", {"table": "tasks", "id": task["id"]}))[
            "result"
        ]
        with patch.object(
            runtime.reminders.planner.stores[self.owner.id],
            "async_save",
            new=AsyncMock(side_effect=OSError("Synthetic storage failure")),
        ):
            failed = await self.request(
                "set_personal_task_completed",
                {"id": task["id"], "revision": latest["revision"], "completed": True},
            )
            self.assertFalse(failed["success"])
        self.assertFalse(
            (await self.request("get", {"table": "tasks", "id": task["id"]}))["result"][
                "data"
            ]["completed"]
        )
        with patch(
            "homeassistant.helpers.storage.write_utf8_file_atomic",
            side_effect=WriteError("Synthetic disk failure"),
        ):
            with self.assertLogs("homeassistant.helpers.storage", level="ERROR"):
                failed = await self.request(
                    "set_personal_task_completed",
                    {
                        "id": task["id"],
                        "revision": latest["revision"],
                        "completed": True,
                    },
                )
                self.assertFalse(failed["success"])
        self.assertFalse(
            (await self.request("get", {"table": "tasks", "id": task["id"]}))["result"][
                "data"
            ]["completed"]
        )
        self.connection.user = original

    async def test_one_private_archive_failure_does_not_stop_other_notifications(
        self,
    ) -> None:
        plant = (
            await self.request(
                "create",
                {"table": "plants", "data": {"name": "Synthetic healthy plan"}},
            )
        )["result"]
        await self.request(
            "create",
            {
                "table": "growing_windows",
                "data": {
                    "plant_id": plant["id"],
                    "activity": "care",
                    "environment": "outdoors",
                    "start_month": 11,
                    "start_day": 6,
                    "end_month": 11,
                    "end_day": 30,
                },
            },
        )
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Shared work survives",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        routes = [
            {
                "user_id": user.id,
                "kind": "push",
                "enabled": True,
                "service": "notify.test_local",
                "entity": "",
                "target": "",
            }
            for user in (self.owner, self.editor)
        ]
        await self.request(
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
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
        original = reminder.planner.async_tasks

        async def unavailable(
            user_id: str, *args: Any, **kwargs: Any
        ) -> list[dict[str, Any]]:
            if user_id == self.editor.id:
                raise StorageError("Synthetic private archive failure")
            return await original(user_id, *args, **kwargs)

        with patch.object(reminder.planner, "async_tasks", new=unavailable):
            with self.assertLogs(
                "custom_components.garden_planner.reminders", level="ERROR"
            ):
                await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 2)

    async def test_reload_drains_personal_completion_before_closing_storage(
        self,
    ) -> None:
        plant = (
            await self.request(
                "create", {"table": "plants", "data": {"name": "Synthetic reload work"}}
            )
        )["result"]
        await self.request(
            "create",
            {
                "table": "growing_windows",
                "data": {
                    "plant_id": plant["id"],
                    "activity": "care",
                    "environment": "outdoors",
                    "start_month": 11,
                    "start_day": 6,
                    "end_month": 11,
                    "end_day": 30,
                },
            },
        )
        runtime: Runtime = self.hass.data[f"{DOMAIN}_runtime"]
        service = self.hass.data[DOMAIN]
        actor = Actor(self.owner.id, is_admin=True)
        task = (await service.async_execute("list", {"table": "tasks"}, actor))[0]
        original = runtime.reminders.planner.async_tasks
        entered, release, closed = asyncio.Event(), asyncio.Event(), asyncio.Event()

        async def delayed(
            user_id: str, *args: Any, **kwargs: Any
        ) -> list[dict[str, Any]]:
            rows = await original(user_id, *args, **kwargs)
            entered.set()
            await release.wait()
            return rows

        original_close = service.worker.async_close

        async def observed_close() -> None:
            self.assertTrue(completion.done())
            closed.set()
            await original_close()

        await runtime.coordinator.async_shutdown()
        with (
            patch.object(runtime.coordinator, "async_shutdown", new=AsyncMock()),
            patch.object(runtime.reminders.planner, "async_tasks", new=delayed),
            patch.object(service.worker, "async_close", new=observed_close),
        ):
            completion = asyncio.create_task(
                service.async_execute(
                    "set_personal_task_completed",
                    {"id": task["id"], "revision": task["revision"], "completed": True},
                    actor,
                )
            )
            await asyncio.wait_for(entered.wait(), 5)
            shutdown = asyncio.create_task(runtime.close())
            await asyncio.sleep(0)
            self.assertTrue(runtime.closing)
            self.assertFalse(closed.is_set())
            release.set()
            result = await completion
            self.assertTrue(result["data"]["completed"])
            await shutdown
            self.assertTrue(closed.is_set())
        self.assertTrue(
            runtime.reminders.planner.records[self.owner.id][task["id"]]["data"][
                "completed"
            ]
        )

    async def test_invalid_private_task_store_is_not_silently_recreated(self) -> None:
        planner = PersonalTasks(self.hass, self.hass.data[DOMAIN].worker)
        with patch(
            "custom_components.garden_planner.personal_tasks.Store.async_load",
            new=AsyncMock(return_value={"unexpected": "data"}),
        ):
            with self.assertRaises(StorageError):
                await planner.async_tasks(self.owner.id, date(2026, 11, 6), "de")
        self.assertNotIn(self.owner.id, planner.records)

    async def test_personal_tasks_do_not_leak_to_shared_channel(self) -> None:
        plant = (
            await self.request(
                "create",
                {"table": "plants", "data": {"name": "Synthetic private work"}},
            )
        )["result"]
        await self.request(
            "create",
            {
                "table": "growing_windows",
                "data": {
                    "plant_id": plant["id"],
                    "activity": "direct",
                    "environment": "outdoors",
                    "start_month": 11,
                    "start_day": 6,
                    "end_month": 11,
                    "end_day": 30,
                },
            },
        )
        await self.request(
            "set_settings",
            {
                "settings": {
                    **DEFAULT_OPTIONS,
                    "reminders_enabled": True,
                    "shared_channel_enabled": True,
                    "notify_service": "notify.test_local",
                },
                "confirm": True,
            },
        )
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
        await reminder.async_check(datetime(2026, 11, 6, 12, tzinfo=UTC))
        self.assertEqual(self.delivered, [])
        await self.request(
            "create",
            {
                "table": "tasks",
                "data": {
                    "title": "Shared manual work",
                    "date": "2026-11-06",
                    "activity": "care",
                },
            },
        )
        await reminder.async_check(datetime(2026, 11, 6, 13, tzinfo=UTC))
        self.assertEqual(len(self.delivered), 1)

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
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
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
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
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
        runtime: Runtime = self.hass.data[f"{DOMAIN}_runtime"]
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
        runtime: Runtime = self.hass.data[f"{DOMAIN}_runtime"]
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
        reminder: Reminders = self.hass.data[f"{DOMAIN}_runtime"].reminders
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

    def planned(
        self, data: dict[str, Any], today: date, lead: int, language: str
    ) -> list[tuple[str, str]]:
        plants = data.get("plants", [{"id": "p", "data": {"name": "Crop"}}])
        windows = data.get("growing_windows", [])
        cells = selections(availability(plants, windows), {})
        tasks = visible(
            reconcile({}, plants, windows, cells, "user", today, language, "now")
        )
        return candidates({"tasks": tasks}, today, lead, language)

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
        self.assertEqual(candidates(data, date(2027, 1, 1), 0, "en"), [])
        self.assertEqual(
            self.planned(data, date(2027, 1, 1), 0, "en"),
            [("window:w:2026-12-31", "Crop: Direct sowing · 2026-12-31")],
        )
        self.assertEqual(self.planned(data, date(2027, 1, 8), 0, "de"), [])
        data["plants"][0]["data"]["archived"] = True
        self.assertEqual(self.planned(data, date(2027, 1, 1), 0, "de"), [])

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
        self.assertEqual(self.planned(data, date(2027, 2, 28), 3, "de"), [])
        self.assertEqual(len(self.planned(data, date(2028, 2, 27), 2, "de")), 1)
        self.assertEqual(self.planned(data, date(2028, 2, 27), 1, "de"), [])
