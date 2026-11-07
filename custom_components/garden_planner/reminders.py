"""Opt-in reminders, reserved durably before calling a local HA notify service."""

import asyncio
import hashlib
import json
import logging
from datetime import date, datetime
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .options import notification_destinations, validate_options
from .service import PlannerService

_LOGGER = logging.getLogger(__name__)
ACTIVITIES = {
    "direct": ("Direktsaat", "Direct sowing"),
    "indoors": ("Vorziehen", "Start indoors"),
    "transplant": ("Auspflanzen", "Plant out"),
    "harvest": ("Ernten", "Harvest"),
    "prick_out": ("Pikieren prüfen", "Check pricking out"),
    "care": ("Pflege prüfen", "Check care"),
    "other": ("Gartenarbeit", "Garden task"),
}


def candidates(
    data: dict[str, Any], today: date, lead: int, language: str
) -> list[tuple[str, str]]:
    """Only stored windows/tasks; never fabricate a crop-specific growth schedule."""
    result = []
    plants = {p["id"]: p["data"] for p in data.get("plants", [])}
    for window in data.get("growing_windows", []):
        item = window["data"]
        plant = plants.get(item["plant_id"], {})
        if plant.get("archived"):
            continue
        # Find a new window's actual opening, not any day within an existing window.
        for year in (today.year - 1, today.year, today.year + 1):
            try:
                start = date(year, item["start_month"], item["start_day"])
            except ValueError:
                continue
            if -7 <= (start - today).days <= lead:
                activity = ACTIVITIES[item["activity"]][language == "en"]
                text = (
                    f"{plant.get('name', 'Garden Planner')}: "
                    f"{activity} · {start.isoformat()}"
                )
                result.append((f"window:{window['id']}:{start.isoformat()}", text))
    for task in data.get("tasks", []):
        item = task["data"]
        due = date.fromisoformat(item["date"])
        if not item.get("completed") and -7 <= (due - today).days <= lead:
            result.append(
                (
                    f"task:{task['id']}:{due.isoformat()}",
                    f"{item['title']} · {due.isoformat()}",
                )
            )
    return result


class Reminders:
    """At-most-one attempt per task/window date, including across HA restarts."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, service: PlannerService
    ) -> None:
        self.hass, self.entry, self.service = hass, entry, service
        self.lock = asyncio.Lock()

    async def async_check(self, instant: datetime | None = None) -> None:
        async with self.lock:
            settings = validate_options(dict(self.entry.options))
            if not settings["reminders_enabled"]:
                return
            current = dt_util.as_local(instant or dt_util.utcnow())
            if current.hour < settings["reminder_hour"]:
                return
            users = {u.id: u for u in await self.hass.auth.async_get_users()}
            destinations = []
            seen = set()
            for destination in notification_destinations(settings):
                if not destination["legacy"]:
                    user = users.get(destination["user_id"])
                    if (
                        user is None
                        or not user.is_active
                        or (
                            settings["readers"] is not None
                            and not user.is_admin
                            and user.id not in settings["readers"]
                        )
                    ):
                        continue
                signature = json.dumps(
                    [
                        destination["service"],
                        destination["entity"],
                        destination["target"],
                    ]
                )
                if signature in seen:
                    continue
                seen.add(signature)
                domain, action = destination["service"].split(".", 1)
                if not self.hass.services.has_service(domain, action):
                    _LOGGER.warning(
                        "Garden Planner reminder channel is unavailable; route skipped"
                    )
                    continue
                if destination["entity"]:
                    state = self.hass.states.get(destination["entity"])
                    if state is None or state.state == "unavailable":
                        continue
                destinations.append(
                    (
                        destination,
                        domain,
                        action,
                        hashlib.sha256(signature.encode()).hexdigest()[:24],
                    )
                )
            if not destinations:
                return
            data = {}
            for table in ("plants", "growing_windows", "tasks"):
                data[table] = await self.service.worker.async_call(
                    "list_records", table
                )
            for key, message in candidates(
                data, current.date(), settings["lead_days"], settings["language"]
            ):
                if len(message) > 1000:
                    message = message[:999] + "…"
                for destination, domain, action, signature in destinations:
                    delivery_key = (
                        key if destination["legacy"] else f"{key}:route:{signature}"
                    )
                    if not await self.service.worker.async_call(
                        "claim_reminder", delivery_key, message
                    ):
                        continue
                    payload: dict[str, Any] = {
                        "message": message,
                        "title": "Garden Planner",
                    }
                    if destination["entity"]:
                        payload["entity_id"] = destination["entity"]
                    if destination["target"]:
                        payload["target"] = [destination["target"]]
                    try:
                        await self.hass.services.async_call(
                            domain, action, payload, blocking=True
                        )
                    except Exception:
                        await self.service.worker.async_call(
                            "finish_reminder", delivery_key, "uncertain"
                        )
                        _LOGGER.exception(
                            "Garden Planner reminder attempt failed; "
                            "not automatically repeated"
                        )
                    else:
                        await self.service.worker.async_call(
                            "finish_reminder", delivery_key, "sent"
                        )
