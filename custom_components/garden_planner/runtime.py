"""Own the entry's subscriptions, native entities and validated host settings."""

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from homeassistant.auth.models import User
from homeassistant.components.frontend.storage import async_user_store
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.util import dt as dt_util

from .coordinator import GardenCoordinator
from .models import NotFoundError, StorageError, ValidationError
from .options import notification_destinations, validate_options
from .reminder_preferences import STORE_KEY, availability, selections, updated_many
from .reminders import Reminders
from .service import Actor, PlannerService
from .sidebar import async_sync_sidebar
from .websocket_api import SIGNAL_CHANGED


@dataclass
class Runtime:
    """Own HA resources; shared garden data uses SQLite, private tasks use HA Store."""

    hass: HomeAssistant
    entry: ConfigEntry
    service: PlannerService
    coordinator: GardenCoordinator
    reminders: Reminders
    cancel: list[Callable[[], None]] = field(default_factory=list)
    closing: bool = False
    preference_lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def host_command(
        self, operation: str, params: dict[str, Any], actor: Actor
    ) -> Any:
        if self.closing:
            raise StorageError("Garden Planner is unloading; retry after reload.")
        if operation == "capabilities":
            return {"http_transfer": True, "reminders": True}
        if operation in {
            "list_personal_tasks",
            "get_personal_task",
            "set_personal_task_completed",
        }:
            async with self.preference_lock:
                if self.closing:
                    raise StorageError("Garden Planner is unloading.")
                language = validate_options(dict(self.entry.options))["language"]
                records = await self.reminders.planner.async_tasks(
                    actor.user_id, dt_util.now().date(), language
                )
                if operation == "list_personal_tasks":
                    return records
                if operation == "set_personal_task_completed":
                    return await self.reminders.planner.async_complete(
                        actor.user_id,
                        params["id"],
                        params["revision"],
                        params["completed"],
                    )
                record = next((r for r in records if r["id"] == params["id"]), None)
                if record is None:
                    raise NotFoundError("Personal task not found.")
                return record
        if operation in {
            "get_user_reminders",
            "set_user_reminder",
            "set_user_reminders",
        }:
            async with self.preference_lock:
                if self.closing:
                    raise StorageError("Garden Planner is unloading.")
                plants = await self.service.worker.async_call("list_records", "plants")
                windows = await self.service.worker.async_call(
                    "list_records", "growing_windows"
                )
                available = availability(plants, windows)
                store = await async_user_store(self.hass, actor.user_id)
                stored = store.data.get(STORE_KEY, {})
                if operation != "get_user_reminders":
                    changes = (
                        params["changes"]
                        if operation == "set_user_reminders"
                        else [
                            {
                                "plant_id": params["plant_id"],
                                "activity": params["activity"],
                                "enabled": params["enabled"],
                            }
                        ]
                    )
                    next_stored = updated_many(available, stored, changes)
                    if next_stored != stored:
                        await store.async_set_item(STORE_KEY, next_stored)
                    stored = next_stored
                settings = validate_options(dict(self.entry.options))
                if operation != "get_user_reminders":
                    await self.reminders.planner.async_tasks(
                        actor.user_id,
                        dt_util.now().date(),
                        settings["language"],
                        plants,
                        windows,
                    )
                return {
                    "cells": selections(available, stored),
                    "global_enabled": settings["reminders_enabled"],
                    "personal_destinations": sum(
                        1
                        for route in settings["notification_routes"]
                        if route["user_id"] == actor.user_id and route["enabled"]
                    ),
                    "shared_channel_enabled": settings["shared_channel_enabled"]
                    and bool(settings["notify_service"]),
                }
        if operation == "get_settings":
            users = await self.hass.auth.async_get_users()
            channels = [
                f"notify.{name}"
                for name in self.hass.services.async_services().get("notify", {})
            ]
            settings = validate_options(dict(self.entry.options))
            active_ids = {u.id for u in users if u.is_active and not u.system_generated}
            settings["writers"] = [u for u in settings["writers"] if u in active_ids]
            if settings["readers"] is not None:
                settings["readers"] = [
                    u for u in settings["readers"] if u in active_ids
                ]
            settings["notification_routes"] = [
                r for r in settings["notification_routes"] if r["user_id"] in active_ids
            ]
            return {
                "settings": settings,
                "users": [
                    {"id": u.id, "name": u.name or u.id, "is_admin": u.is_admin}
                    for u in users
                    if u.is_active and not u.system_generated
                ],
                "channels": sorted(channels),
                "notify_entities": [
                    {"id": state.entity_id, "name": state.name}
                    for state in self.hass.states.async_all("notify")
                ],
            }
        if operation != "set_settings" or params.get("confirm") is not True:
            raise ValidationError("Settings require explicit confirmation.")
        settings = validate_options(params["settings"])
        await validate_host_options(self.hass, settings)
        self.hass.config_entries.async_update_entry(self.entry, options=settings)
        self.service.writers = frozenset(settings["writers"])
        self.service.readers = (
            None if settings["readers"] is None else frozenset(settings["readers"])
        )
        await async_sync_sidebar(self.hass, self.service.readers)
        async_dispatcher_send(self.hass, SIGNAL_CHANGED)
        return settings

    async def close(self) -> None:
        if self.closing:
            return
        self.closing = True
        for cancel in reversed(self.cancel):
            cancel()
        self.cancel.clear()
        await self.coordinator.async_shutdown()
        # Drain reminder activity before closing its database worker.
        async with self.reminders.lock:
            async with self.preference_lock:
                async with self.reminders.planner.lock:
                    await self.service.worker.async_close()


async def validate_host_options(hass: HomeAssistant, settings: dict[str, Any]) -> None:
    users: list[User] = await hass.auth.async_get_users()
    allowed = {u.id for u in users if u.is_active and not u.system_generated}
    if set(settings["writers"]) - allowed or (
        settings["readers"] is not None and set(settings["readers"]) - allowed
    ):
        raise ValidationError("Permissions must refer to active HA users.")
    for route in settings["notification_routes"]:
        if route["enabled"] and route["user_id"] not in allowed:
            raise ValidationError("Notification recipients must be active HA users.")
        if (
            route["enabled"]
            and settings["readers"] is not None
            and route["user_id"] not in settings["readers"]
            and not any(u.id == route["user_id"] and u.is_admin for u in users)
        ):
            raise ValidationError(
                "Notification recipients need garden viewing permission."
            )
    if settings["reminders_enabled"]:
        for destination in notification_destinations(settings):
            domain, action = destination["service"].split(".", 1)
            if not hass.services.has_service(domain, action):
                raise ValidationError(
                    "The selected notification channel is unavailable."
                )
            if destination["entity"] and hass.states.get(destination["entity"]) is None:
                raise ValidationError(
                    "The selected notification entity is unavailable."
                )
