"""Small native aggregate entities; no helper/attribute database."""

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import GardenCoordinator


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: GardenCoordinator = hass.data[f"{DOMAIN}_runtime"].coordinator
    async_add_entities(
        [
            GardenCount(coordinator, entry, key)
            for key in ("plants", "planned", "active", "successful", "open_tasks")
        ]
    )


class GardenCount(CoordinatorEntity[GardenCoordinator], SensorEntity):
    """An explicit recorded count, never inferred horticultural success."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:sprout"

    def __init__(
        self, coordinator: GardenCoordinator, entry: ConfigEntry, key: str
    ) -> None:
        super().__init__(coordinator)
        self.key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Garden Planner",
            "manufacturer": "Garden Planner",
        }

    @property
    def native_value(self) -> int | None:
        value: Any = self.coordinator.data.get("summary", {}).get(self.key)
        return int(value) if isinstance(value, int) else None
