"""Personal growing-window subscriptions; unavailable/new pairs default on."""

from typing import Any

from .models import ValidationError

STORE_KEY = "garden_planner_reminders"


def availability(
    plants: list[dict[str, Any]], windows: list[dict[str, Any]]
) -> dict[str, dict[str, list[str]]]:
    active = {p["id"] for p in plants if not p["data"].get("archived")}
    result: dict[str, dict[str, list[str]]] = {}
    for window in windows:
        data = window["data"]
        if data["plant_id"] in active:
            result.setdefault(data["plant_id"], {}).setdefault(
                data["activity"], []
            ).append(window["id"])
    return result


def selections(
    available: dict[str, dict[str, list[str]]], stored: Any
) -> dict[str, dict[str, bool]]:
    disabled = stored.get("disabled", {}) if isinstance(stored, dict) else {}
    if not isinstance(disabled, dict):
        disabled = {}
    result: dict[str, dict[str, bool]] = {}
    for plant_id, activities in available.items():
        previous = disabled.get(plant_id, {})
        if not isinstance(previous, dict):
            previous = {}
        result[plant_id] = {}
        for activity, ids in activities.items():
            old_ids = previous.get(activity, [])
            result[plant_id][activity] = not (
                isinstance(old_ids, list) and any(i in old_ids for i in ids)
            )
    return result


def updated(
    available: dict[str, dict[str, list[str]]],
    stored: Any,
    plant_id: str,
    activity: str,
    enabled: bool,
) -> dict[str, Any]:
    if type(enabled) is not bool or activity not in available.get(plant_id, {}):
        raise ValidationError("Choose an existing growing-window activity.")
    current = selections(available, stored)
    current[plant_id][activity] = enabled
    # Persist only current opt-outs and their window generation; stale pairs disappear.
    return {
        "disabled": {
            pid: {act: available[pid][act] for act, value in acts.items() if not value}
            for pid, acts in current.items()
            if not all(acts.values())
        }
    }
