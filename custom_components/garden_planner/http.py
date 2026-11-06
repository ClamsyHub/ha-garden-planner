"""Authenticated, bounded JSON transport for file exchange beyond WebSocket limits."""

import json

from aiohttp import web
from homeassistant.auth.models import User
from homeassistant.components.http.const import KEY_HASS_USER
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.http import HomeAssistantView

from .const import DOMAIN
from .models import MAX_IMPORT_BYTES, PlannerError
from .service import WRITE_OPERATIONS, Actor, PlannerService
from .websocket_api import SIGNAL_CHANGED

ALLOWED = {"export", "preview_import", "import", "list", "history"}
MAX_BODY = MAX_IMPORT_BYTES * 2 + 1024 * 1024


class ExchangeView(HomeAssistantView):
    """HA's normal auth middleware authenticates before this view is invoked."""

    url = "/api/garden_planner/exchange"
    name = "api:garden_planner:exchange"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request: web.Request) -> web.Response:
        user: User | None = request.get(KEY_HASS_USER)
        if user is None or not user.is_active:
            return self.json({"code": "unauthorized"}, status_code=403)
        service: PlannerService | None = self.hass.data.get(DOMAIN)
        if service is None:
            return self.json({"code": "not_loaded"}, status_code=503)
        body = bytearray()
        async for chunk in request.content.iter_chunked(65536):
            body.extend(chunk)
            if len(body) > MAX_BODY:
                return self.json({"code": "invalid_data"}, status_code=413)
        try:
            value = await self.hass.async_add_executor_job(json.loads, bytes(body))
            if (
                not isinstance(value, dict)
                or set(value) - {"operation", "parameters"}
                or value.get("operation") not in ALLOWED
            ):
                raise ValueError
            result = await service.async_execute(
                value["operation"],
                value.get("parameters", {}),
                Actor(user.id, user.is_admin, user.is_active),
            )
        except (ValueError, TypeError, RecursionError):
            return self.json({"code": "invalid_data"}, status_code=400)
        except PlannerError as err:
            return self.json({"code": err.code}, status_code=400)
        if value["operation"] in WRITE_OPERATIONS:
            async_dispatcher_send(self.hass, SIGNAL_CHANGED)
        # Encoding large exports belongs outside the event loop too.
        output = await self.hass.async_add_executor_job(json.dumps, result)
        return web.Response(
            text=output,
            content_type="application/json",
            headers={"Cache-Control": "no-store"},
        )
