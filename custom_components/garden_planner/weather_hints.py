"""Optional forecast hints from an explicitly configured HA weather entity."""

import asyncio
import math
from datetime import datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

from .storage.worker import PlannerWorker


def forecast_minimum(
    rows: Any, unit: str, now: datetime, hours: int
) -> tuple[float, str] | None:
    if not isinstance(rows, list) or unit not in {"°C", "°F", "K"}:
        return None
    found: list[tuple[float, str]] = []
    end = now + timedelta(hours=hours)
    for row in rows[:500]:
        if not isinstance(row, dict) or not isinstance(row.get("datetime"), str):
            continue
        instant = dt_util.parse_datetime(row["datetime"])
        if instant is None or instant.utcoffset() is None or not now <= instant <= end:
            continue
        for field in ("temperature", "templow"):
            value = row.get(field)
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                continue
            if not math.isfinite(value):
                continue
            celsius = (
                (value - 32) * 5 / 9
                if unit == "°F"
                else value - 273.15
                if unit == "K"
                else value
            )
            if -100 <= celsius <= 70:
                found.append((round(celsius, 2), instant.isoformat()))
    return min(found, key=lambda item: item[0]) if found else None


def exposed_cultures(
    cultures: list[dict[str, Any]], events: list[dict[str, Any]], today: str
) -> list[dict[str, str]]:
    result = []
    for culture in cultures:
        data = culture["data"]
        history = sorted(
            [
                e
                for e in events
                if e["data"]["cultivation_id"] == culture["id"]
                and e["data"]["date"] <= today
            ],
            key=lambda e: (e["data"]["date"], e["created_at"], e["id"]),
        )
        status = (
            history[-1]["data"]["status"]
            if history
            else data.get("initial_status", "sown")
        )
        plant = data["snapshot"]["plant"]
        sensitive = data.get("frost_sensitive")
        if sensitive is None:
            sensitive = plant.get("frost_sensitive", False)
        if (
            data.get("outdoors") is True
            and sensitive is True
            and data["date"] <= today
            and status not in {"planned", "completed", "failed"}
        ):
            result.append({"id": culture["id"], "name": plant["name"]})
    return result


class WeatherHints:
    def __init__(self, hass: HomeAssistant, worker: PlannerWorker) -> None:
        self.hass, self.worker = hass, worker
        self.lock = asyncio.Lock()
        self.cached_entity = ""
        self.cached_at: datetime | None = None
        self.cached: dict[str, Any] | None = None

    async def async_read(self, settings: dict[str, Any]) -> dict[str, Any]:
        entity = settings["weather_entity"]
        if not entity:
            return {"status": "disabled", "alerts": []}
        now = dt_util.utcnow()
        async with self.lock:
            if (
                entity != self.cached_entity
                or self.cached_at is None
                or now - self.cached_at > timedelta(minutes=15)
            ):
                self.cached_entity = entity
                self.cached_at = now
                self.cached = None
                state = self.hass.states.get(entity)
                if state and state.state not in {"unknown", "unavailable"}:
                    for kind in ("hourly", "twice_daily", "daily"):
                        try:
                            async with asyncio.timeout(12):
                                value = await self.hass.services.async_call(
                                    "weather",
                                    "get_forecasts",
                                    {"entity_id": entity, "type": kind},
                                    blocking=True,
                                    return_response=True,
                                )
                            raw = (
                                value.get(entity, {}) if isinstance(value, dict) else {}
                            )
                            rows = (
                                raw.get("forecast") if isinstance(raw, dict) else None
                            )
                            if isinstance(rows, list) and rows:
                                self.cached = {
                                    "rows": rows,
                                    "type": kind,
                                    "unit": state.attributes.get(
                                        "temperature_unit", ""
                                    ),
                                    "name": state.name,
                                }
                                break
                        except (HomeAssistantError, TimeoutError):
                            continue
                if self.cached is None:
                    self.cached_at = now - timedelta(minutes=14, seconds=30)
            if self.cached is None:
                return {"status": "unavailable", "entity": entity, "alerts": []}
            cached = self.cached
        minimum = forecast_minimum(
            cached["rows"], cached["unit"], now, settings["weather_hours"]
        )
        if minimum is None:
            return {"status": "unavailable", "entity": entity, "alerts": []}
        cultures = await self.worker.async_call(
            "list_records", "cultivations", include_images=False
        )
        events = await self.worker.async_call("list_records", "cultivation_events")
        exposed = exposed_cultures(cultures, events, dt_util.now().date().isoformat())
        return {
            "status": "ready",
            "entity": entity,
            "name": cached["name"],
            "hours": settings["weather_hours"],
            "minimum_c": minimum[0],
            "datetime": minimum[1],
            "forecast_type": cached["type"],
            "checked_at": self.cached_at.isoformat()
            if self.cached_at
            else now.isoformat(),
            "alerts": exposed if minimum[0] <= settings["frost_warning_c"] else [],
        }
