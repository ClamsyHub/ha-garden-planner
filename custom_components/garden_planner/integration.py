"""Home Assistant lifecycle, automatic panel, entities and opt-in reminders."""

from datetime import timedelta
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.dispatcher import (
    async_dispatcher_connect,
    async_dispatcher_send,
)
from homeassistant.helpers.event import async_track_time_interval

from .const import DOMAIN
from .coordinator import GardenCoordinator
from .frontend import async_register_frontend, async_remove_frontend
from .http import ExchangeView
from .models import StorageError
from .options import validate_options
from .reminders import Reminders
from .runtime import Runtime
from .service import PlannerService
from .storage import PlannerWorker
from .websocket_api import SIGNAL_CHANGED, async_register_api

PLATFORMS = [Platform.SENSOR, Platform.CALENDAR]
RUNTIME_KEY = f"{DOMAIN}_runtime"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up all resources transactionally; cleanup on any setup failure."""
    if DOMAIN in hass.data:
        raise ConfigEntryNotReady(
            "Only one shared Garden Planner instance is supported."
        )
    settings = validate_options(dict(entry.options))
    worker = PlannerWorker(Path(hass.config.path(DOMAIN)))
    runtime: Runtime | None = None
    panel_added = False
    try:
        await worker.async_open()
        service = PlannerService(worker, frozenset(settings["writers"]))
        coordinator = GardenCoordinator(hass, service, entry)
        reminders = Reminders(hass, entry, service)
        runtime = Runtime(hass, entry, service, coordinator, reminders)
        service.host_handler = runtime.host_command
        hass.data[DOMAIN] = service
        hass.data[RUNTIME_KEY] = runtime
        async_register_api(hass)
        if not hass.data.get(f"{DOMAIN}_exchange_registered"):
            hass.http.register_view(ExchangeView(hass))
            hass.data[f"{DOMAIN}_exchange_registered"] = True
        await async_register_frontend(hass)
        panel_added = True
        await coordinator.async_refresh()
        if not coordinator.last_update_success:
            raise ConfigEntryNotReady("Initial Garden Planner refresh failed.")
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

        @callback
        def changed() -> None:
            if not runtime or runtime.closing:
                return
            hass.async_create_task(coordinator.async_request_refresh())

        async def tick(instant: Any) -> None:
            if not runtime or runtime.closing:
                return
            await reminders.async_check(instant)

        async def stop(event: Event[Any]) -> None:
            if runtime:
                await runtime.close()

        async def options_changed(host: HomeAssistant, config: ConfigEntry) -> None:
            service.writers = frozenset(
                validate_options(dict(config.options))["writers"]
            )
            async_dispatcher_send(hass, SIGNAL_CHANGED)

        runtime.cancel.extend(
            [
                async_dispatcher_connect(hass, SIGNAL_CHANGED, changed),
                async_track_time_interval(hass, tick, timedelta(minutes=15)),
                hass.bus.async_listen(EVENT_HOMEASSISTANT_STOP, stop),
                entry.add_update_listener(options_changed),
            ]
        )
    except Exception as err:
        if panel_added:
            async_remove_frontend(hass)
        hass.data.pop(DOMAIN, None)
        hass.data.pop(RUNTIME_KEY, None)
        if runtime:
            await runtime.close()
        else:
            await worker.async_close()
        if isinstance(err, StorageError):
            raise ConfigEntryNotReady(str(err)) from err
        raise
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unregister entities/panel, stop reminders, preserve private garden records."""
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    runtime: Runtime | None = hass.data.pop(RUNTIME_KEY, None)
    hass.data.pop(DOMAIN, None)
    async_remove_frontend(hass)
    if runtime:
        await runtime.close()
    return True
