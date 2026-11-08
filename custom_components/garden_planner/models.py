"""Validated, JSON-safe domain records independent of Home Assistant."""

import math
import re
from datetime import date, datetime
from typing import Any

MAX_TEXT = 20000
MAX_RECORDS = 50000
MAX_IMPORT_BYTES = 20 * 1024 * 1024
SCHEMA_VERSION = 3
FORMAT_VERSION = 1
STATUSES = (
    "planned",
    "sown",
    "germinated",
    "pricked_out",
    "planted_out",
    "growing",
    "harvesting",
    "completed",
    "failed",
)
METHODS = ("direct", "indoors", "transplant")
KINDS = ("air", "soil", "substrate")
RESULTS = ("unknown", "successful", "partial", "failed")


class PlannerError(Exception):
    """An actionable domain failure with a stable API error code."""

    code = "planner_error"


class ValidationError(PlannerError):
    """Invalid input or unsupported data."""

    code = "invalid_data"


class NotFoundError(PlannerError):
    """The requested record does not exist."""

    code = "not_found"


class ConflictError(PlannerError):
    """Record changed, has dependents, or import preview became stale."""

    code = "conflict"


class StorageError(PlannerError):
    """Storage cannot safely proceed."""

    code = "storage_error"


# JSON document attributes are separated from indexed relational columns in SQLite.
# Unknown fields are rejected so misspelled observations cannot silently disappear.
TEXT_FIELDS = {
    "name",
    "botanical_name",
    "category",
    "description",
    "notes",
    "light",
    "water",
    "frost",
    "care",
    "site",
    "soil",
    "location_type",
    "source",
    "source_url",
    "regional_notes",
    "title",
    "sensor_entity_id",
}
NUMBER_FIELDS = {
    "germination_min_c",
    "germination_optimal_min_c",
    "germination_optimal_max_c",
    "germination_max_c",
    "germination_days_min",
    "germination_days_max",
    "depth_cm",
    "spacing_cm",
    "row_spacing_cm",
    "duration_days_min",
    "duration_days_max",
    "quantity",
    "temperature_c",
}
PLANT_MEASURE_FIELDS = {
    "germination_min_c",
    "germination_optimal_min_c",
    "germination_optimal_max_c",
    "germination_max_c",
    "germination_days_min",
    "germination_days_max",
    "depth_cm",
    "spacing_cm",
    "row_spacing_cm",
    "duration_days_min",
    "duration_days_max",
}


def clean_master_data(table: str, data: Any) -> Any:
    """Discard retired live-master fields, never frozen cultivation snapshots."""
    if not isinstance(data, dict):
        return data
    retired = (
        PLANT_MEASURE_FIELDS
        if table == "varieties"
        else {"variety_id"}
        if table == "growing_windows"
        else set()
    )
    return {key: value for key, value in data.items() if key not in retired}


PLANT_FIELDS = {
    "name",
    "botanical_name",
    "category",
    "description",
    "notes",
    "light",
    "water",
    "frost",
    "care",
    "site",
    "depth_cm",
    "spacing_cm",
    "row_spacing_cm",
    "germination_min_c",
    "germination_optimal_min_c",
    "germination_optimal_max_c",
    "germination_max_c",
    "germination_days_min",
    "germination_days_max",
    "duration_days_min",
    "duration_days_max",
    "source",
    "source_url",
    "archived",
}
FIELDS: dict[str, set[str]] = {
    "plants": PLANT_FIELDS,
    "varieties": PLANT_FIELDS | {"plant_id"},
    "growing_windows": {
        "plant_id",
        "variety_id",
        "activity",
        "method",
        "environment",
        "start_month",
        "start_day",
        "end_month",
        "end_day",
        "notes",
        "source",
        "source_url",
        "regional_notes",
        "germination_min_c",
        "germination_optimal_min_c",
        "germination_optimal_max_c",
        "germination_max_c",
        "germination_days_min",
        "germination_days_max",
        "duration_days_min",
        "duration_days_max",
    },
    "locations": {
        "name",
        "location_type",
        "light",
        "soil",
        "description",
        "notes",
        "sensor_entity_id",
        "measurement_kind",
        "archived",
    },
    "cultivations": {
        "plant_id",
        "variety_id",
        "location_id",
        "date",
        "method",
        "quantity",
        "temperature_c",
        "measurement_kind",
        "notes",
        "result",
        "germination_result",
        "harvest_result",
        "initial_status",
        "snapshot",
    },
    "cultivation_events": {"cultivation_id", "date", "status", "notes", "origin"},
    "tasks": {
        "title",
        "date",
        "activity",
        "notes",
        "plant_id",
        "cultivation_id",
        "location_id",
        "completed",
    },
}
TABLES = tuple(FIELDS)
PARENTS: dict[str, dict[str, str]] = {
    "plants": {},
    "varieties": {"plant_id": "plants"},
    "growing_windows": {"plant_id": "plants", "variety_id": "varieties"},
    "locations": {},
    "cultivations": {
        "plant_id": "plants",
        "variety_id": "varieties",
        "location_id": "locations",
    },
    "cultivation_events": {"cultivation_id": "cultivations"},
    "tasks": {
        "plant_id": "plants",
        "cultivation_id": "cultivations",
        "location_id": "locations",
    },
}
REQUIRED = {
    "plants": {"name"},
    "varieties": {"plant_id", "name"},
    "growing_windows": {
        "plant_id",
        "activity",
        "environment",
        "start_month",
        "start_day",
        "end_month",
        "end_day",
    },
    "locations": {"name"},
    "cultivations": {"plant_id", "date", "method"},
    "cultivation_events": {"cultivation_id", "date", "status"},
    "tasks": {"title", "date", "activity"},
}


def identifier(value: Any) -> str:
    """Require a safe stable identifier, not arbitrary SQL or a path."""
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", value):
        raise ValidationError("Invalid record identifier.")
    return value


def iso_date(value: Any) -> str:
    """Require an unambiguous ISO date, not a datetime or compact date."""
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValidationError("Expected an ISO date (YYYY-MM-DD).")
    try:
        date.fromisoformat(value)
    except ValueError as err:
        raise ValidationError("Invalid calendar date.") from err
    return value


def timestamp(value: Any) -> str:
    """Validate timezone-aware audit timestamps from import files."""
    try:
        parsed = datetime.fromisoformat(value)
        if parsed.utcoffset() is None:
            raise ValueError
    except (TypeError, ValueError) as err:
        raise ValidationError("Expected a timezone-aware timestamp.") from err
    return str(value)


def positive_revision(value: Any) -> int:
    """Prevent booleans and invalid optimistic-lock revisions."""
    if type(value) is not int or value < 1:
        raise ValidationError("Expected a positive integer revision.")
    return int(value)


def validate_data(table: str, data: Any, *, internal: bool = False) -> dict[str, Any]:
    """Validate a complete record; defaults are applied only to creates/imports."""
    if not isinstance(table, str) or table not in FIELDS:
        raise ValidationError("Unknown record type.")
    if not isinstance(data, dict) or not all(isinstance(k, str) for k in data):
        raise ValidationError("Record data must be an object.")
    if set(data) - FIELDS[table] or REQUIRED[table] - set(data):
        raise ValidationError("Unknown or missing record fields.")
    result: dict[str, Any] = dict(data)
    for key, value in result.items():
        if value is None:
            if key in REQUIRED[table] or key in {
                "initial_status",
                "archived",
                "completed",
            }:
                raise ValidationError(f"{key} must not be null.")
            continue
        if key in TEXT_FIELDS:
            if not isinstance(value, str) or len(value) > MAX_TEXT:
                raise ValidationError(
                    f"{key} must be text of at most {MAX_TEXT} characters."
                )
            if key in {"name", "title"} and not value.strip():
                raise ValidationError(f"{key} must not be empty.")
        elif key in NUMBER_FIELDS:
            if type(value) not in (int, float) or not math.isfinite(value):
                raise ValidationError(f"{key} must be a finite number.")
            if not key.endswith("_c") and value < 0:
                raise ValidationError(f"{key} must not be negative.")
            if "days" in key and type(value) is not int:
                raise ValidationError(f"{key} must be an integer.")
        elif key.endswith("_id"):
            identifier(value)
        elif key in {"archived", "completed"}:
            if type(value) is not bool:
                raise ValidationError(f"{key} must be boolean.")
        elif key == "date":
            iso_date(value)
    enums = {
        "status": STATUSES,
        "initial_status": ("planned", "sown"),
        "method": METHODS,
        "measurement_kind": KINDS,
        "result": RESULTS,
        "germination_result": RESULTS,
        "harvest_result": RESULTS,
        "activity": (
            "indoors",
            "direct",
            "transplant",
            "harvest",
            "prick_out",
            "care",
            "other",
        ),
        "environment": ("outdoors", "greenhouse", "cold_frame", "indoors"),
        "origin": ("initial", "manual"),
    }
    for key, options in enums.items():
        if key in result and result[key] is not None and result[key] not in options:
            raise ValidationError(f"Unsupported {key}.")
    for low, high in (
        ("germination_min_c", "germination_optimal_min_c"),
        ("germination_optimal_min_c", "germination_optimal_max_c"),
        ("germination_optimal_max_c", "germination_max_c"),
        ("germination_min_c", "germination_max_c"),
        ("germination_days_min", "germination_days_max"),
        ("duration_days_min", "duration_days_max"),
    ):
        if (
            result.get(low) is not None
            and result.get(high) is not None
            and result[low] > result[high]
        ):
            raise ValidationError(f"{low} must not exceed {high}.")
    ordered_temperatures = [
        result[key]
        for key in (
            "germination_min_c",
            "germination_optimal_min_c",
            "germination_optimal_max_c",
            "germination_max_c",
        )
        if result.get(key) is not None
    ]
    if ordered_temperatures != sorted(ordered_temperatures):
        raise ValidationError("Germination temperature bounds must be ordered.")
    if table == "growing_windows":
        for prefix in ("start", "end"):
            month, day = result[f"{prefix}_month"], result[f"{prefix}_day"]
            try:
                if type(month) is not int or type(day) is not int:
                    raise ValueError
                date(
                    2000, month, day
                )  # A leap-day window is a valid yearly definition.
            except (ValueError, TypeError) as err:
                raise ValidationError("Invalid month/day boundary.") from err
    if (
        result.get("temperature_c") is not None
        and result.get("measurement_kind") is None
    ):
        raise ValidationError(
            "A temperature observation requires its measurement kind."
        )
    if result.get("sensor_entity_id"):
        if not re.fullmatch(r"sensor\.[a-z0-9_]+", result["sensor_entity_id"]):
            raise ValidationError("Expected a sensor entity ID.")
        if result.get("measurement_kind") is None:
            raise ValidationError("A sensor requires its measurement kind.")
    if not internal and ("snapshot" in result or "origin" in result):
        raise ValidationError(
            "Historical snapshots and event origin are server-managed."
        )
    if "snapshot" in result:
        snap = result["snapshot"]
        if not isinstance(snap, dict) or set(snap) != {
            "plant",
            "variety",
            "location",
            "windows",
        }:
            raise ValidationError("Invalid historical snapshot.")
        validate_data("plants", snap["plant"], internal=True)
        for field, kind in (("variety", "varieties"), ("location", "locations")):
            if snap[field] is not None:
                validate_data(kind, snap[field], internal=True)
        if not isinstance(snap["windows"], list):
            raise ValidationError("Invalid snapshot windows.")
        for window in snap["windows"]:
            validate_data("growing_windows", window, internal=True)
    return result
