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
from .options import validate_options
from .reminders import Reminders
from .service import Actor, PlannerService
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
            return {
                "settings": validate_options(dict(self.entry.options)),
                "users": [
                    {"id": u.id, "name": u.name or u.id}
                    for u in users
                    if u.is_active and not u.system_generated
                ],
                "channels": sorted(channels),
            }
        if operation != "set_settings" or params.get("confirm") is not True:
            raise ValidationError("Settings require explicit confirmation.")
        settings = validate_options(params["settings"])
        await validate_host_options(self.hass, settings)
        self.hass.config_entries.async_update_entry(self.entry, options=settings)
        self.service.writers = frozenset(settings["writers"])
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
    if set(settings["writers"]) - allowed:
        raise ValidationError("Editing grants must refer to active HA users.")
    if settings["reminders_enabled"]:
        domain, action = settings["notify_service"].split(".", 1)
        if not hass.services.has_service(domain, action):
            raise ValidationError("The selected notification channel is unavailable.")
        if (
            settings["notify_entity"]
            and hass.states.get(settings["notify_entity"]) is None
        ):
            raise ValidationError("The selected notification entity is unavailable.")
