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

from .models import PlannerError
from .options import notification_destinations, validate_options
from .personal_tasks import PersonalTasks
from .service import PlannerService

_LOGGER = logging.getLogger(__name__)


def candidates(
    data: dict[str, Any], today: date, lead: int, language: str
) -> list[tuple[str, str]]:
    """Only saved tasks can notify; raw growing windows never dispatch directly."""
    result = []
    for task in data.get("tasks", []):
        item = task["data"]
        due = date.fromisoformat(item["date"])
        if not item.get("completed") and -7 <= (due - today).days <= lead:
            result.append(
                (
                    (
                        f"window:{item['source_window_id']}:{due.isoformat()}"
                        if item.get("personal_generated")
                        else f"task:{task['id']}:{due.isoformat()}"
                    ),
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
        self.planner = PersonalTasks(hass, service.worker)

    async def async_check(self, instant: datetime | None = None) -> None:
        async with self.lock:
            settings = validate_options(dict(self.entry.options))
            current = dt_util.as_local(instant or dt_util.utcnow())
            users = {u.id: u for u in await self.hass.auth.async_get_users()}
            plants = await self.service.worker.async_call("list_records", "plants")
            windows = await self.service.worker.async_call(
                "list_records", "growing_windows"
            )
            personal: dict[str, list[dict[str, Any]]] = {}
            for user in users.values():
                if (
                    user.is_active
                    and not user.system_generated
                    and (
                        user.is_admin
                        or self.service.readers is None
                        or user.id in self.service.readers
                    )
                ):
                    try:
                        personal[user.id] = await self.planner.async_tasks(
                            user.id,
                            current.date(),
                            settings["language"],
                            plants,
                            windows,
                        )
                    except PlannerError:
                        _LOGGER.exception(
                            "Personal tasks unavailable; continuing other deliveries"
                        )
            # Planning is independent of notification activation and dispatch hour.
            if (
                not settings["reminders_enabled"]
                or current.hour < settings["reminder_hour"]
            ):
                return
            destinations = []
            for destination in notification_destinations(settings):
                if not destination["legacy"]:
                    recipient = users.get(destination["user_id"])
                    if (
                        recipient is None
                        or not recipient.is_active
                        or (
                            settings["readers"] is not None
                            and not recipient.is_admin
                            and recipient.id not in settings["readers"]
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
            shared_tasks = await self.service.worker.async_call("list_records", "tasks")
            jobs: list[tuple[str, str, str | None]] = [
                (key, message, None)
                for key, message in candidates(
                    {"tasks": shared_tasks},
                    current.date(),
                    settings["lead_days"],
                    settings["language"],
                )
            ]
            for user_id, records in personal.items():
                jobs.extend(
                    (key, message, user_id)
                    for key, message in candidates(
                        {"tasks": records},
                        current.date(),
                        settings["lead_days"],
                        settings["language"],
                    )
                )
            seen: set[tuple[str, str]] = set()
            for key, message, owner in jobs:
                if len(message) > 1000:
                    message = message[:999] + "…"
                for destination, domain, action, signature in destinations:
                    if owner is not None and (
                        destination["legacy"] or destination["user_id"] != owner
                    ):
                        continue
                    if (key, signature) in seen:
                        continue
                    seen.add((key, signature))
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
