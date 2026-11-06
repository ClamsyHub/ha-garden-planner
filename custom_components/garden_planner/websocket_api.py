"""Authenticated Home Assistant transport for the Garden Planner service."""

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import (
    async_response,
    websocket_command,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import (
    async_dispatcher_connect,
    async_dispatcher_send,
)

from .const import DOMAIN
from .models import PlannerError
from .service import WRITE_OPERATIONS, Actor, PlannerService

SIGNAL_CHANGED = f"{DOMAIN}_changed"


@callback
def async_register_api(hass: HomeAssistant) -> None:
    """Command registration is idempotent across integration reloads."""
    websocket_api.async_register_command(hass, command)
    websocket_api.async_register_command(hass, subscribe)


@websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/command",
        vol.Required("operation"): str,
        vol.Optional("parameters", default=dict): dict,
    }
)
@async_response
async def command(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
) -> None:
    """Never trust actor identity, roles or arbitrary filesystem paths in input."""
    service: PlannerService | None = hass.data.get(DOMAIN)
    if service is None:
        connection.send_error(msg["id"], "not_loaded", "Garden Planner is not loaded.")
        return
    user = connection.user
    actor = Actor(user_id=user.id, is_admin=user.is_admin, is_active=user.is_active)
    try:
        result = await service.async_execute(msg["operation"], msg["parameters"], actor)
    except PlannerError as err:
        connection.send_error(msg["id"], err.code, str(err))
        return
    connection.send_result(msg["id"], result)
    if msg["operation"] in WRITE_OPERATIONS:
        async_dispatcher_send(hass, SIGNAL_CHANGED)


@websocket_command({"type": f"{DOMAIN}/subscribe"})
@callback
def subscribe(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send invalidation only; clients reload authorized records as needed."""
    if not connection.user.is_active:
        connection.send_error(msg["id"], "unauthorized", "An active user is required.")
        return

    @callback
    def changed() -> None:
        connection.send_event(msg["id"], {"changed": True})

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, SIGNAL_CHANGED, changed
    )
    connection.send_result(msg["id"])
