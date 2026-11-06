"""Lossless multi-table CSV exchange with typed JSON cells and bounded input."""

import csv
import json
from io import StringIO
from typing import Any

from .models import FIELDS, MAX_IMPORT_BYTES, MAX_RECORDS, TABLES, ValidationError
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
        or set(files) != required
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
            fields = sorted(FIELDS[table])
            reader = csv.reader(
                StringIO(files[f"{table}.csv"], newline=""), strict=True
            )
            if next(reader) != [*META, *fields]:
                raise ValueError
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
