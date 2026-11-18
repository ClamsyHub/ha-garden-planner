"""Lossless multi-table CSV exchange with typed JSON cells and bounded input."""

import csv
import json
from io import StringIO
from typing import Any

from .models import (
    FIELDS,
    GARDEN_FIELDS,
    MAX_IMPORT_BYTES,
    MAX_RECORDS,
    NEW_TABLES,
    TABLES,
    ValidationError,
)
from .storage.database import encode

META = ("id", "revision", "created_at", "updated_at")


def export_csv(payload: dict[str, Any]) -> dict[str, str]:
    """Each cell is JSON-encoded, preventing spreadsheet formula execution."""
    files = {
        "metadata.json": encode({k: v for k, v in payload.items() if k != "tables"})
    }
    for table in TABLES:
        fields = sorted(FIELDS[table])
        output = StringIO(newline="")
        writer = csv.writer(output)
        writer.writerow([*META, *fields])
        for record in payload["tables"][table]:
            writer.writerow(
                [
                    *(encode(record[k]) for k in META),
                    *(
                        encode(record["data"][k]) if k in record["data"] else ""
                        for k in fields
                    ),
                ]
            )
        files[f"{table}.csv"] = output.getvalue()
    return files


def import_csv(files: Any) -> dict[str, Any]:
    """Parse an explicit set of files, never extract caller-controlled paths."""
    required = {"metadata.json", *(f"{t}.csv" for t in TABLES)}
    if (
        not isinstance(files, dict)
        or set(files) - required
        or (required - set(files)) - {f"{t}.csv" for t in NEW_TABLES}
        or not all(isinstance(v, str) for v in files.values())
    ):
        raise ValidationError(
            "Expected metadata.json and exactly the known CSV tables."
        )
    if sum(len(v.encode()) for v in files.values()) > MAX_IMPORT_BYTES:
        raise ValidationError("CSV import exceeds 20 MiB.")
    try:
        metadata = json.loads(files["metadata.json"])
        if not isinstance(metadata, dict) or set(metadata) != {
            "format_version",
            "schema_version",
            "exported_at",
        }:
            raise ValueError
        tables: dict[str, list[dict[str, Any]]] = {}
        count = 0
        for table in TABLES:
            if f"{table}.csv" not in files:
                if (
                    table not in NEW_TABLES
                    or type(metadata["schema_version"]) is not int
                    or metadata["schema_version"] >= 4
                ):
                    raise ValueError
                tables[table] = []
                continue
            fields = sorted(FIELDS[table])
            reader = csv.reader(
                StringIO(files[f"{table}.csv"], newline=""), strict=True
            )
            header = next(reader)
            present = header[len(META) :]
            missing = set(fields) - set(present)
            optional = (
                (GARDEN_FIELDS | {"image_data", "frost_sensitive"})
                if table == "plants"
                else (
                    {"image_data"}
                    if table in {"varieties", "cultivation_events"}
                    else {"plant_count", "image_data", "outdoors", "frost_sensitive"}
                    if table == "cultivations"
                    else {"repeat_every_days", "repeat_until", "next_task_id"}
                    if table == "tasks"
                    else set()
                )
            )
            if (
                header[: len(META)] != list(META)
                or present != sorted(set(present))
                or set(present) - set(fields)
                or missing - optional
            ):
                raise ValueError
            fields = present
            records = []
            for row in reader:
                count += 1
                if count > MAX_RECORDS or len(row) != len(META) + len(fields):
                    raise ValueError
                record = {k: json.loads(row[i]) for i, k in enumerate(META)}
                record["data"] = {
                    k: json.loads(row[i + len(META)])
                    for i, k in enumerate(fields)
                    if row[i + len(META)] != ""
                }
                records.append(record)
            tables[table] = records
        return {**metadata, "tables": tables}
    except (ValueError, TypeError, StopIteration, csv.Error) as err:
        raise ValidationError(
            "Malformed structured CSV; use JSON export for large snapshots."
        ) from err
