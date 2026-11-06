"""Validated integration options; imports cannot opt users into notifications."""

import re
from typing import Any

from .models import ValidationError

DEFAULT_OPTIONS: dict[str, Any] = {
    "writers": [],
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
    if result["reminders_enabled"] and not result["notify_service"]:
        raise ValidationError(
            "Choose a notification channel before enabling reminders."
        )
    if (
        result["notify_service"] == "notify.send_message"
        and not result["notify_entity"]
    ):
        raise ValidationError("notify.send_message requires a notification entity.")
    return result
