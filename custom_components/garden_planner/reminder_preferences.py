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
    return updated_many(
        available,
        stored,
        [{"plant_id": plant_id, "activity": activity, "enabled": enabled}],
    )


def updated_many(
    available: dict[str, dict[str, list[str]]], stored: Any, changes: Any
) -> dict[str, Any]:
    """Validate the entire bounded batch before applying it in a single pass."""
    if not isinstance(changes, list) or not 1 <= len(changes) <= 500:
        raise ValidationError("Choose between one and 500 reminder changes.")
    seen: set[tuple[str, str]] = set()
    for change in changes:
        if not isinstance(change, dict) or set(change) != {
            "plant_id",
            "activity",
            "enabled",
        }:
            raise ValidationError("Invalid reminder change fields.")
        pid, activity = change["plant_id"], change["activity"]
        if (
            not isinstance(pid, str)
            or not isinstance(activity, str)
            or type(change["enabled"]) is not bool
            or activity not in available.get(pid, {})
        ):
            raise ValidationError("Choose an existing growing-window activity.")
        if (pid, activity) in seen:
            raise ValidationError("Duplicate reminder changes.")
        seen.add((pid, activity))
    current = selections(available, stored)
    for change in changes:
        current[change["plant_id"]][change["activity"]] = change["enabled"]
    return {
        "disabled": {
            pid: {act: available[pid][act] for act, value in acts.items() if not value}
            for pid, acts in current.items()
            if not all(acts.values())
        }
    }
