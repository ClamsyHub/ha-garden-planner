"""Validated integration options; imports cannot opt users into notifications."""

import re
from typing import Any

from .models import ValidationError

DEFAULT_OPTIONS: dict[str, Any] = {
    "writers": [],
    "readers": None,
    "notification_routes": [],
    "shared_channel_enabled": True,
    "reminders_enabled": False,
    "lead_days": 3,
    "reminder_hour": 9,
    "notify_service": "",
    "notify_entity": "",
    "language": "de",
}


def validate_options(value: Any) -> dict[str, Any]:
    """Validate a complete options object independently of any UI transport."""
    if not isinstance(value, dict) or set(value) - set(DEFAULT_OPTIONS):
        raise ValidationError("Unknown settings.")
    result = {**DEFAULT_OPTIONS, **value}
    if type(result["shared_channel_enabled"]) is not bool:
        raise ValidationError("Shared channel activation must be explicit.")
    if type(result["reminders_enabled"]) is not bool:
        raise ValidationError("Reminder activation must be explicit.")
    if type(result["lead_days"]) is not int or not 0 <= result["lead_days"] <= 30:
        raise ValidationError("Lead time must be 0–30 days.")
    if (
        type(result["reminder_hour"]) is not int
        or not 0 <= result["reminder_hour"] <= 23
    ):
        raise ValidationError("Reminder hour must be 0–23.")
    if result["language"] not in ("de", "en"):
        raise ValidationError("Unsupported reminder language.")
    if not isinstance(result["writers"], list) or not all(
        isinstance(u, str) and re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", u)
        for u in result["writers"]
    ):
        raise ValidationError("Invalid editing grants.")
    for key, pattern in (
        ("notify_service", r"notify\.[a-z0-9_]+"),
        ("notify_entity", r"notify\.[a-z0-9_]+"),
    ):
        if (
            not isinstance(result[key], str)
            or result[key]
            and not re.fullmatch(pattern, result[key])
        ):
            raise ValidationError("Invalid notification target.")
    readers = result["readers"]
    if readers is not None and (
        not isinstance(readers, list)
        or not all(
            isinstance(u, str) and re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", u)
            for u in readers
        )
    ):
        raise ValidationError("Invalid viewing grants.")
    if readers is not None and set(result["writers"]) - set(readers):
        raise ValidationError("Editing requires viewing permission.")
    routes = result["notification_routes"]
    if not isinstance(routes, list) or len(routes) > 100:
        raise ValidationError("Expected at most 100 notification routes.")
    seen = set()
    for route in routes:
        if not isinstance(route, dict) or set(route) != {
            "user_id",
            "kind",
            "enabled",
            "service",
            "entity",
            "target",
        }:
            raise ValidationError("Invalid notification route fields.")
        if (
            not isinstance(route["user_id"], str)
            or not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", route["user_id"])
            or route["kind"] not in ("push", "email")
        ):
            raise ValidationError("Invalid route user or kind.")
        pair = (route["user_id"], route["kind"])
        if pair in seen or type(route["enabled"]) is not bool:
            raise ValidationError("Duplicate route or invalid activation.")
        seen.add(pair)
        for key in ("service", "entity"):
            if not isinstance(route[key], str) or (
                route[key] and not re.fullmatch(r"notify\.[a-z0-9_]+", route[key])
            ):
                raise ValidationError("Invalid route channel or entity.")
        if not isinstance(route["target"], str) or len(route["target"]) > 254:
            raise ValidationError("Invalid route recipient.")
        if route["target"] and (
            route["kind"] != "email"
            or route["service"] == "notify.send_message"
            or not re.fullmatch(
                r"[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+", route["target"]
            )
        ):
            raise ValidationError("Use an email address only for legacy email routes.")
        if route["enabled"]:
            if not route["service"]:
                raise ValidationError("Choose a channel for each enabled route.")
            if route["service"] == "notify.send_message" and not route["entity"]:
                raise ValidationError("Choose a notify entity for this route.")
            if route["service"] != "notify.send_message" and route["entity"]:
                raise ValidationError("Legacy channels do not use an entity field.")
            if (
                route["kind"] == "email"
                and route["service"] != "notify.send_message"
                and not route["target"]
            ):
                raise ValidationError("Choose an explicit recipient for legacy email.")
    if (
        result["reminders_enabled"]
        and not (result["shared_channel_enabled"] and result["notify_service"])
        and not any(r["enabled"] for r in routes)
    ):
        raise ValidationError(
            "Choose a notification channel before enabling reminders."
        )
    if (
        result["shared_channel_enabled"]
        and result["notify_service"] == "notify.send_message"
        and not result["notify_entity"]
    ):
        raise ValidationError("notify.send_message requires a notification entity.")
    return result


def notification_destinations(settings: dict[str, Any]) -> list[dict[str, Any]]:
    """Keep the old shared channel while adding explicitly enabled user routes."""
    result = []
    if settings["shared_channel_enabled"] and settings["notify_service"]:
        result.append(
            {
                "service": settings["notify_service"],
                "entity": settings["notify_entity"],
                "target": "",
                "legacy": True,
            }
        )
    result.extend(
        {**r, "legacy": False} for r in settings["notification_routes"] if r["enabled"]
    )
    return result
