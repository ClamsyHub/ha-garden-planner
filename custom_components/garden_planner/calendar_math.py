"""Pure seasonal-date calculations, including winter and leap-day windows."""

from datetime import date, timedelta
from typing import Any

from .models import validate_data


def contains_day(window: dict[str, Any], day: date) -> bool:
    """A leap-day-only window is absent during non-leap years; never shift it."""
    validate_data("growing_windows", window)
    start = (window["start_month"], window["start_day"])
    end = (window["end_month"], window["end_day"])
    current = (day.month, day.day)
    return (
        start <= current <= end if start <= end else current >= start or current <= end
    )


def next_window_day(window: dict[str, Any], today: date) -> date | None:
    """Find the next eligible day, including the next leap year if needed."""
    for offset in range(366 * 8):
        try:
            candidate = today + timedelta(days=offset)
        except OverflowError:
            return None
        if contains_day(window, candidate):
            return candidate
    return None
