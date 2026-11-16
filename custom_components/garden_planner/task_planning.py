"""Pure, idempotent annual task planning from personal plant/activity choices."""

from calendar import monthrange
from copy import deepcopy
from datetime import date, timedelta
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from .models import (
    MAX_RECORDS,
    ConflictError,
    NotFoundError,
    StorageError,
    ValidationError,
    positive_revision,
)

PREFIX = "personal-"
LABELS = {
    "indoors": ("Vorziehen", "Start indoors"),
    "direct": ("Direktsaat", "Direct sowing"),
    "prick_out": ("Pikieren", "Prick out"),
    "transplant": ("Auspflanzen", "Plant out"),
    "care": ("Pflege", "Care"),
    "fertilize": ("Düngen", "Fertilize"),
    "prune": ("Rückschnitt", "Prune"),
    "harvest": ("Ernte", "Harvest"),
    "other": ("Sonstige Gartenarbeit", "Other garden work"),
}


def period_end(data: dict[str, Any], start: date) -> str:
    """Inclusive seasonal end; winter periods finish in the following year."""
    month, day = data["end_month"], data["end_day"]
    year = start.year + ((month, day) < (start.month, start.day))
    if year > date.max.year:
        return date.max.isoformat()
    return date(year, month, min(day, monthrange(year, month)[1])).isoformat()


def reconcile(
    existing: dict[str, Any],
    plants: list[dict[str, Any]],
    windows: list[dict[str, Any]],
    cells: dict[str, dict[str, bool]],
    user_id: str,
    today: date,
    language: str,
    stamp: str,
) -> dict[str, Any]:
    """Keep completed history and stable IDs; cancel only obsolete open tasks."""
    result = deepcopy(existing)
    names = {
        p["id"]: p["data"]["name"] for p in plants if not p["data"].get("archived")
    }
    sources = {w["id"]: w["data"] for w in windows if w["data"]["plant_id"] in names}
    wanted: dict[str, dict[str, Any]] = {}
    earliest = today - timedelta(days=min(7, (today - date.min).days))
    latest = min(date.max, today + timedelta(days=min(366, (date.max - today).days)))
    for window_id, data in sources.items():
        if not cells.get(data["plant_id"], {}).get(data["activity"], False):
            continue
        for year in range(max(1, today.year - 1), min(9999, today.year + 1) + 1):
            try:
                start = date(year, data["start_month"], data["start_day"])
            except ValueError:
                continue
            if not earliest <= start <= latest:
                continue
            task_id = (
                PREFIX
                + uuid5(
                    NAMESPACE_URL,
                    f"garden_planner:{user_id}:{window_id}:{start.isoformat()}",
                ).hex
            )
            caption = LABELS[data["activity"]][language == "en"]
            wanted[task_id] = {
                "title": f"{names[data['plant_id']]}: {caption}",
                "date": start.isoformat(),
                "end_date": period_end(data, start),
                "activity": data["activity"],
                "plant_id": data["plant_id"],
                "notes": data.get("notes", ""),
                "completed": False,
                "personal_generated": True,
                "source_window_id": window_id,
            }
    # Keep overdue unfinished work until done, unless its source/selection changed.
    for task_id, record in result.items():
        if record["data"].get("completed") or record.get("cancelled"):
            continue
        item = record["data"]
        source = sources.get(item["source_window_id"])
        if source and cells.get(source["plant_id"], {}).get(source["activity"], False):
            due = date.fromisoformat(item["date"])
            if (due.month, due.day) == (source["start_month"], source["start_day"]):
                caption = LABELS[source["activity"]][language == "en"]
                wanted.setdefault(
                    task_id,
                    {
                        **item,
                        "title": f"{names[source['plant_id']]}: {caption}",
                        "end_date": period_end(source, due),
                        "activity": source["activity"],
                        "notes": source.get("notes", ""),
                    },
                )
    for task_id, data in wanted.items():
        record = result.get(task_id)
        if record and record["data"].get("completed"):
            continue
        if record is None:
            if len(result) >= MAX_RECORDS:
                raise StorageError(
                    "Personal task history exceeds the supported record limit."
                )
            result[task_id] = {
                "id": task_id,
                "revision": 1,
                "created_at": stamp,
                "updated_at": stamp,
                "data": data,
                "cancelled": False,
            }
        elif record["data"] != data or record.get("cancelled"):
            record.update(
                data=data,
                cancelled=False,
                revision=record["revision"] + 1,
                updated_at=stamp,
            )
    for task_id, record in result.items():
        if (
            task_id not in wanted
            and not record["data"].get("completed")
            and not record.get("cancelled")
        ):
            record.update(
                cancelled=True, revision=record["revision"] + 1, updated_at=stamp
            )
    return result


def visible(records: dict[str, Any]) -> list[dict[str, Any]]:
    """Private storage metadata is never returned to the frontend."""
    return [
        deepcopy({k: v for k, v in record.items() if k != "cancelled"})
        for record in records.values()
        if not record.get("cancelled")
    ]


def complete(
    existing: dict[str, Any], task_id: str, revision: int, completed: bool, stamp: str
) -> dict[str, Any]:
    """Complete only a record from the owner's ledger, with optimistic locking."""
    positive_revision(revision)
    if type(completed) is not bool:
        raise ValidationError("Completed must be a boolean.")
    record = existing.get(task_id)
    if record is None or record.get("cancelled"):
        raise NotFoundError("Personal task not found.")
    if record["revision"] != revision:
        raise ConflictError("Personal task changed; refresh before editing.")
    result = deepcopy(existing)
    result[task_id]["data"]["completed"] = completed
    result[task_id]["revision"] += 1
    result[task_id]["updated_at"] = stamp
    return result
