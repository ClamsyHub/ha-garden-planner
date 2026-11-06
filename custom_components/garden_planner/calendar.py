"""Read-only HA calendar for actual tasks and recorded culture events."""

from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import GardenCoordinator

EVENT_LABELS = {
    "planned": ("Geplant", "Planned"),
    "sown": ("Ausgesät", "Sown"),
    "germinated": ("Gekeimt", "Germinated"),
    "pricked_out": ("Pikiert", "Pricked out"),
    "planted_out": ("Ausgepflanzt", "Planted out"),
    "growing": ("Wachstumsphase", "Growing"),
    "harvesting": ("Ernte begonnen", "Harvest started"),
    "completed": ("Abgeschlossen", "Completed"),
    "failed": ("Fehlgeschlagen", "Failed"),
}


def calendar_events(data: dict[str, Any], language: str = "de") -> list[CalendarEvent]:
    """Use exclusive end dates and stable IDs; general growing windows are not tasks."""
    result = []
    cultures = {c["id"]: c["data"] for c in data.get("cultivations", [])}
    locations = {p["id"]: p["data"]["name"] for p in data.get("locations", [])}
    for task in data.get("tasks", []):
        item = task["data"]
        if item.get("completed"):
            continue
        start = date.fromisoformat(item["date"])
        result.append(
            CalendarEvent(
                start=start,
                end=start + timedelta(days=1),
                summary=item["title"],
                description=item.get("notes"),
                location=locations.get(item.get("location_id")),
                uid=f"task_{task['id']}",
            )
        )
    for event in data.get("cultivation_events", []):
        item = event["data"]
        culture = cultures.get(item["cultivation_id"], {})
        plant = (
            culture.get("snapshot", {}).get("plant", {}).get("name", "Garden Planner")
        )
        status = EVENT_LABELS.get(item["status"], (item["status"], item["status"]))[
            language == "en"
        ]
        start = date.fromisoformat(item["date"])
        result.append(
            CalendarEvent(
                start=start,
                end=start + timedelta(days=1),
                summary=f"{plant} · {status}",
                description=item.get("notes"),
                location=locations.get(culture.get("location_id")),
                uid=f"event_{event['id']}",
            )
        )
    return sorted(
        result, key=lambda event: (event.start_datetime_local, event.uid or "")
    )


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: GardenCoordinator = hass.data[f"{DOMAIN}_runtime"].coordinator
    async_add_entities([GardenCalendar(coordinator, entry)])


class GardenCalendar(CoordinatorEntity[GardenCoordinator], CalendarEntity):
    """Edit records through Garden Planner, not lossy generic calendar CRUD."""

    _attr_has_entity_name = True
    _attr_translation_key = "work"
    _attr_icon = "mdi:calendar-month"

    def __init__(self, coordinator: GardenCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self.entry = entry
        self._attr_unique_id = f"{entry.entry_id}_calendar"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Garden Planner",
            "manufacturer": "Garden Planner",
        }

    @property
    def event(self) -> CalendarEvent | None:
        return next(
            (
                e
                for e in calendar_events(
                    self.coordinator.data, self.entry.options.get("language", "de")
                )
                if e.end_datetime_local > dt_util.now()
            ),
            None,
        )

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        return [
            e
            for e in calendar_events(
                self.coordinator.data, self.entry.options.get("language", "de")
            )
            if e.start_datetime_local < end_date and e.end_datetime_local > start_date
        ]
