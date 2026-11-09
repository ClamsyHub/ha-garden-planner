"""Own the entry's subscriptions, native entities and validated host settings."""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from homeassistant.auth.models import User
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .coordinator import GardenCoordinator
from .models import ValidationError
from .options import notification_destinations, validate_options
from .reminders import Reminders
from .service import Actor, PlannerService
from .sidebar import async_sync_sidebar
from .websocket_api import SIGNAL_CHANGED


@dataclass
class Runtime:
    """Ephemeral HA resources; all garden data remains owned by SQLite."""

    hass: HomeAssistant
    entry: ConfigEntry
    service: PlannerService
    coordinator: GardenCoordinator
    reminders: Reminders
    cancel: list[Callable[[], None]] = field(default_factory=list)
    closing: bool = False

    async def host_command(
        self, operation: str, params: dict[str, Any], actor: Actor
    ) -> Any:
        if operation == "capabilities":
            return {"http_transfer": True, "reminders": True}
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
