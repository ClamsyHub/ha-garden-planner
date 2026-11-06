"""Garden Planner: local multi-year cultivation data for Home Assistant."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Load HA-specific adapters lazily; domain models remain host-independent."""
    from .integration import async_setup_entry as setup_entry

    return await setup_entry(hass, entry)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Close the worker while preserving every user record."""
    from .integration import async_unload_entry as unload_entry

    return await unload_entry(hass, entry)
