"""Integration tests against real HA classes and WebSocket command dispatch."""

import json
import logging
import tempfile
import unittest
from pathlib import Path
from types import MappingProxyType
from typing import Any
from unittest.mock import AsyncMock, patch

from homeassistant.auth.models import User
from homeassistant.auth.permissions.models import PermissionLookup
from homeassistant.components.http import HomeAssistantHTTP
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.http import WebSocketAdapter
from homeassistant.config_entries import ConfigEntries, ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import AbortFlow
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.device_registry import DeviceRegistry
from homeassistant.helpers.entity_registry import EntityRegistry
from homeassistant.helpers.http import KEY_ALLOW_CONFIGURED_CORS

from custom_components.garden_planner.config_flow import GardenPlannerConfigFlow
from custom_components.garden_planner.const import DOMAIN
from custom_components.garden_planner.integration import (
    async_setup_entry,
    async_unload_entry,
)
from custom_components.garden_planner.models import StorageError
from custom_components.garden_planner.service import PlannerService
from custom_components.garden_planner.storage import PlannerWorker


class IntegrationHarness(unittest.IsolatedAsyncioTestCase):
    """Do not start a webserver or connect to any production HA instance."""

    async def asyncSetUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.hass = HomeAssistant(self.temp.name)
        self.hass.config_entries = ConfigEntries(self.hass, {})
        await self.hass.config_entries.async_initialize()
        self.hass.http = HomeAssistantHTTP(
            self.hass, None, None, None, ["127.0.0.1"], 0, [], "modern"
        )
        self.hass.http.app[KEY_ALLOW_CONFIGURED_CORS] = lambda route: None
        self.forward = patch.object(
            self.hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
        )
        self.forward.start()
        self.addCleanup(self.forward.stop)
        self.unload = patch.object(
            self.hass.config_entries,
            "async_unload_platforms",
            new=AsyncMock(return_value=True),
        )
        self.unload.start()
        self.addCleanup(self.unload.stop)
        self.entry = ConfigEntry(
            version=1,
            minor_version=1,
            domain=DOMAIN,
            title="Garden Planner",
            data={},
            options={},
            source="user",
            unique_id=DOMAIN,
            discovery_keys=MappingProxyType({}),
            subentries_data=None,
        )
        await async_setup_entry(self.hass, self.entry)
        self.addAsyncCleanup(self.cleanup)
        self.messages: list[dict[str, Any]] = []
        self.sequence = 0
        self.connection = self.connect(admin=True)

    async def cleanup(self) -> None:
        self.connection.async_handle_close()
        await async_unload_entry(self.hass, self.entry)
        await self.entry._async_process_on_unload(self.hass)
        await self.hass.async_stop(force=True)

    def connect(self, *, admin: bool) -> ActiveConnection:
        user = User(
            name="Synthetic test user",
            is_owner=admin,
            is_active=True,
            perm_lookup=PermissionLookup(
                EntityRegistry(self.hass), DeviceRegistry(self.hass)
            ),
        )

        def receive(message: bytes | str | dict[str, Any]) -> None:
            self.messages.append(
                json.loads(message) if isinstance(message, (bytes, str)) else message
            )

        return ActiveConnection(
            WebSocketAdapter(logging.getLogger(__name__), {"connid": "test"}),
            self.hass,
            receive,
            user,
            None,
            None,
        )

    async def request(
        self, operation: str, parameters: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        self.sequence += 1
        mid = self.sequence
        self.connection.async_handle(
            {
                "id": mid,
                "type": f"{DOMAIN}/command",
                "operation": operation,
                "parameters": parameters or {},
            }
        )
        await self.hass.async_block_till_done(wait_background_tasks=True)
        return next(
            m
            for m in reversed(self.messages)
            if m["id"] == mid and m["type"] == "result"
        )


class IntegrationTests(IntegrationHarness):
    """Baseline adapter behavior under the full phase-5 lifecycle."""

    async def test_config_flow_form_and_confirmation(self) -> None:
        flow = GardenPlannerConfigFlow()
        flow.hass = self.hass
        flow.handler = DOMAIN
        flow.context = {"source": "user"}
        form = await flow.async_step_user(None)
        self.assertEqual(form["type"], "form")
        created = await flow.async_step_user({})
        self.assertEqual(created["type"], "create_entry")
        self.assertEqual(created["title"], "Garden Planner")

    async def test_websocket_crud_and_reload_persist_records(self) -> None:
        response = await self.request(
            "create", {"table": "plants", "data": {"name": "Test crop"}}
        )
        self.assertTrue(response["success"])
        plant = response["result"]
        await async_unload_entry(self.hass, self.entry)
        await self.entry._async_process_on_unload(self.hass)
        await async_setup_entry(self.hass, self.entry)
        response = await self.request("get", {"table": "plants", "id": plant["id"]})
        self.assertEqual(response["result"]["data"]["name"], "Test crop")
        self.assertTrue(
            (Path(self.temp.name) / DOMAIN / "garden_planner.sqlite3").exists()
        )

    async def test_normal_user_cannot_write_or_restore(self) -> None:
        self.connection = self.connect(admin=False)
        for operation, params in (
            ("create", {"table": "plants", "data": {"name": "Forbidden"}}),
            ("restore", {"name": "anything", "token": "anything", "confirm": True}),
        ):
            response = await self.request(operation, params)
            self.assertFalse(response["success"])
            self.assertEqual(response["error"]["code"], "unauthorized")
        self.assertTrue((await self.request("summary"))["success"])
        service: PlannerService = self.hass.data[DOMAIN]
        self.assertEqual(await service.worker.async_call("list_records", "plants"), [])

    async def test_invalid_actor_parameter_cannot_grant_permissions(self) -> None:
        self.connection = self.connect(admin=False)
        response = await self.request("summary", {"actor": {"is_admin": True}})
        self.assertEqual(response["error"]["code"], "invalid_data")

    async def test_subscription_receives_change_and_unsubscribe_works(self) -> None:
        self.sequence += 1
        sid = self.sequence
        self.connection.async_handle({"id": sid, "type": f"{DOMAIN}/subscribe"})
        await self.request(
            "create", {"table": "plants", "data": {"name": "Observable"}}
        )
        await self.hass.async_block_till_done()
        self.assertTrue(
            any(m["id"] == sid and m["type"] == "event" for m in self.messages)
        )
        self.connection.subscriptions.pop(sid)()
        self.messages.clear()
        await self.request(
            "create", {"table": "plants", "data": {"name": "After unsubscribe"}}
        )
        self.assertFalse(any(m["type"] == "event" for m in self.messages))

    async def test_admin_export_backup_and_restore_over_websocket(self) -> None:
        plant = (
            await self.request(
                "create", {"table": "plants", "data": {"name": "Original"}}
            )
        )["result"]
        backup = (await self.request("backup"))["result"]
        await self.request(
            "update",
            {
                "table": "plants",
                "id": plant["id"],
                "revision": 1,
                "data": {"name": "Changed"},
            },
        )
        plan = (await self.request("preview_restore", {"name": backup}))["result"]
        response = await self.request(
            "restore", {"name": backup, "token": plan["token"], "confirm": True}
        )
        self.assertTrue(response["success"])
        exported = (await self.request("export"))["result"]
        self.assertEqual(exported["tables"]["plants"][0]["data"]["name"], "Original")

    async def test_stop_event_drains_worker(self) -> None:
        service: PlannerService = self.hass.data[DOMAIN]
        self.hass.bus.async_fire(EVENT_HOMEASSISTANT_STOP)
        await self.hass.async_block_till_done()
        with self.assertRaises(StorageError):
            await service.worker.async_call("summary")

    async def test_config_flow_refuses_existing_unique_garden(self) -> None:
        self.hass.config_entries._entries[self.entry.entry_id] = self.entry
        flow = GardenPlannerConfigFlow()
        flow.hass = self.hass
        flow.handler = DOMAIN
        flow.context = {"source": "user"}
        with self.assertRaises(AbortFlow) as caught:
            await flow.async_step_user({})
        self.assertEqual(caught.exception.reason, "already_configured")

    async def test_storage_setup_failure_becomes_retryable(self) -> None:
        await async_unload_entry(self.hass, self.entry)
        with patch.object(
            PlannerWorker, "async_open", side_effect=StorageError("Test failure")
        ):
            with self.assertRaises(ConfigEntryNotReady):
                await async_setup_entry(self.hass, self.entry)
        self.assertNotIn(DOMAIN, self.hass.data)

    async def test_unloaded_api_reports_not_loaded(self) -> None:
        await async_unload_entry(self.hass, self.entry)
        response = await self.request("summary")
        self.assertEqual(response["error"]["code"], "not_loaded")


if __name__ == "__main__":
    unittest.main()
