"""Transactional SQLite repository. All methods execute on one worker thread."""

import hashlib
import json
import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from datetime import UTC, date, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any
from uuid import uuid4

from ..models import (
    FIELDS,
    FORMAT_VERSION,
    MAX_IMPORT_BYTES,
    MAX_RECORDS,
    PARENTS,
    PLANT_MEASURE_FIELDS,
    SCHEMA_VERSION,
    TABLES,
    ConflictError,
    NotFoundError,
    StorageError,
    ValidationError,
    clean_master_data,
    identifier,
    positive_revision,
    timestamp,
    validate_data,
)
from .schema import APPLICATION_ID, MIGRATIONS


def encode(value: Any) -> str:
    """Use canonical JSON for checksums, snapshots and stable exports."""
    try:
        return json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
    except (ValueError, TypeError) as err:
        raise ValidationError("Expected finite JSON data.") from err


def now() -> str:
    """UTC timestamps are audit information, not local gardening dates."""
    return datetime.now(UTC).isoformat()


class Database:
    """Own a SQLite connection; never invoke directly from the HA event loop."""

    def __init__(self, directory: Path) -> None:
        self.directory = directory
        self.path = directory / "garden_planner.sqlite3"
        self.connection: sqlite3.Connection | None = None

    @property
    def db(self) -> sqlite3.Connection:
        """Refuse operations before open or after shutdown."""
        if self.connection is None:
            raise StorageError("Storage is not open.")
        return self.connection

    def open(self) -> None:
        """Refuse unrelated, corrupt or newer DBs before applying migrations."""
        if self.connection is not None:
            return
        self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        conn = sqlite3.connect(self.path, autocommit=True, timeout=10)
        conn.row_factory = sqlite3.Row
        self.connection = conn
        try:
            version = int(conn.execute("PRAGMA user_version").fetchone()[0])
            app_id = int(conn.execute("PRAGMA application_id").fetchone()[0])
            existing = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
            if version > SCHEMA_VERSION:
                raise StorageError(
                    "Database uses a newer schema; upgrade Garden Planner."
                )
            if (existing or version) and app_id != APPLICATION_ID:
                raise StorageError(
                    "Not a Garden Planner database; refusing to modify it."
                )
            if version < 0 or (existing and version == 0):
                raise StorageError("Unsupported database schema.")
            if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise StorageError("Database integrity check failed.")
            conn.execute("PRAGMA foreign_keys=ON")
            if conn.execute("PRAGMA foreign_key_check").fetchone():
                raise StorageError("Database relationship integrity check failed.")
            if version and version < SCHEMA_VERSION:
                self.backup("before-migration")
            with self.transaction():
                for target in range(version + 1, SCHEMA_VERSION + 1):
                    for statement in MIGRATIONS[target]:
                        conn.execute(statement)
                    conn.execute(
                        "INSERT INTO schema_migrations VALUES (?, ?)", (target, now())
                    )
                    conn.execute(f"PRAGMA user_version={target}")
                conn.execute(f"PRAGMA application_id={APPLICATION_ID}")
                highest = max(
                    (
                        conn.execute(
                            f"SELECT COALESCE(MAX(revision), 0) FROM {table}"
                        ).fetchone()[0]
                        for table in TABLES
                    ),
                    default=0,
                )
                conn.execute(
                    "INSERT OR IGNORE INTO settings VALUES ('generation', ?)",
                    (str(highest),),
                )
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=FULL")
            self.path.chmod(0o600)
        except Exception:
            self.close()
            raise

    def close(self) -> None:
        """Close the connection on the thread that created it."""
        if self.connection is not None:
            self.connection.close()
            self.connection = None

    @contextmanager
    def transaction(self) -> Iterator[None]:
        """Roll back the entire write on validation or constraint failure."""
        self.db.execute("BEGIN IMMEDIATE")
        try:
            yield
            self.db.execute("COMMIT")
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def _touch(self, minimum_revision: int = 0) -> None:
        self.db.execute(
            "UPDATE settings SET value=MAX(CAST(value AS INTEGER)+1, ?) "
            "WHERE key='generation'",
            (minimum_revision,),
        )

    @staticmethod
    def _table(table: str) -> str:
        if table not in TABLES:
            raise ValidationError("Unknown record type.")
        return table

    def get(self, table: str, record_id: str) -> dict[str, Any]:
        """Read a record or report a stable not-found failure."""
        table = self._table(table)
        identifier(record_id)
        row = self.db.execute(
            f"SELECT * FROM {table} WHERE id=?", (record_id,)
        ).fetchone()
        if row is None:
            raise NotFoundError("Record not found.")
        return self._record(row)

    @staticmethod
    def _record(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "revision": row["revision"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "data": json.loads(row["data"]),
        }

    def list_records(
        self, table: str, filters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Return stable records; bounded fields prevent arbitrary SQL filters."""
        table = self._table(table)
        filters = filters or {}
        if not isinstance(filters, dict) or set(filters) - {
            *PARENTS[table],
            "year",
            "archived",
        }:
            raise ValidationError("Unsupported filter.")
        conditions: list[str] = []
        arguments: list[Any] = []
        for key, value in filters.items():
            if key in PARENTS[table]:
                identifier(value)
                conditions.append(f"{key}=?")
                arguments.append(value)
            elif key == "year":
                if (
                    table != "cultivations"
                    or type(value) is not int
                    or not 1 <= value <= 9999
                ):
                    raise ValidationError("Year filtering requires a cultivation year.")
            elif key == "archived":
                if "archived" not in FIELDS[table] or type(value) is not bool:
                    raise ValidationError(
                        "Archived filtering requires a boolean master-data flag."
                    )
                conditions.append("COALESCE(json_extract(data, '$.archived'), 0)=?")
                arguments.append(value)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        records = [
            self._record(row)
            for row in self.db.execute(
                f"SELECT * FROM {table}{where} ORDER BY id", arguments
            )
        ]
        if "year" in filters:
            dates = {
                r["id"]: r["sowing_date"] or r["data"]["date"]
                for r in self._histories(records)
            }
            records = [
                r
                for r in records
                if date.fromisoformat(dates[r["id"]]).year == filters["year"]
            ]
        return records

    def _references(self, table: str, data: dict[str, Any]) -> None:
        for field, target in PARENTS[table].items():
            if data.get(field) is not None:
                self.get(target, data[field])
        if data.get("variety_id"):
            variety = self.get("varieties", data["variety_id"])["data"]
            if variety["plant_id"] != data.get("plant_id"):
                raise ValidationError("Variety belongs to a different plant.")
        if table == "tasks" and data.get("cultivation_id"):
            cultivation = self.get("cultivations", data["cultivation_id"])["data"]
            for field in ("plant_id", "location_id"):
                if data.get(field) is not None and data[field] != cultivation.get(
                    field
                ):
                    raise ValidationError("Task and cultivation references disagree.")

    def _snapshot(self, data: dict[str, Any]) -> dict[str, Any]:
        plant = self.get("plants", data["plant_id"])["data"]
        variety = (
            self.get("varieties", data["variety_id"])["data"]
            if data.get("variety_id")
            else None
        )
        location = (
            self.get("locations", data["location_id"])["data"]
            if data.get("location_id")
            else None
        )
        if any(
            value and value.get("archived", False)
            for value in (plant, variety, location)
        ):
            raise ValidationError("Cannot start a culture with archived master data.")
        windows = [
            {
                key: value
                for key, value in r["data"].items()
                if key not in PLANT_MEASURE_FIELDS
            }
            for r in self.list_records(
                "growing_windows", {"plant_id": data["plant_id"]}
            )
        ]
        return {
            "plant": plant,
            "variety": variety,
            "location": location,
            "windows": windows,
        }

    def _insert(self, table: str, record: dict[str, Any]) -> None:
        data = record["data"]
        self._references(table, data)
        columns = [
            "id",
            "revision",
            "created_at",
            "updated_at",
            "data",
            *PARENTS[table],
        ]
        values = [
            record["id"],
            record["revision"],
            record["created_at"],
            record["updated_at"],
            encode(data),
            *(data.get(field) for field in PARENTS[table]),
        ]
        marks = ",".join("?" for _ in columns)
        try:
            self.db.execute(
                f"INSERT INTO {table} ({','.join(columns)}) VALUES ({marks})", values
            )
        except sqlite3.IntegrityError as err:
            raise ConflictError(
                "Record or relationship conflicts with stored data."
            ) from err

    def _new(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        stamp = now()
        record = {
            "id": uuid4().hex,
            "revision": 1,
            "created_at": stamp,
            "updated_at": stamp,
            "data": data,
        }
        self._insert(table, record)
        return record

    def create(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create validated records and an initial lifecycle event atomically."""
        clean = validate_data(table, clean_master_data(table, data))
        with self.transaction():
            self._references(table, clean)
            if table == "cultivations":
                clean["snapshot"] = self._snapshot(clean)
                clean.setdefault("initial_status", "sown")
                clean.setdefault("result", "unknown")
            record = self._new(table, clean)
            if table == "cultivations":
                self._new(
                    "cultivation_events",
                    {
                        "cultivation_id": record["id"],
                        "date": clean["date"],
                        "status": clean["initial_status"],
                        "origin": "initial",
                    },
                )
            self._touch()
        return record

    def _write(self, table: str, record: dict[str, Any], data: dict[str, Any]) -> None:
        self._references(table, data)
        assignments = [
            "data=?",
            "revision=revision+1",
            "updated_at=?",
            *(f"{field}=?" for field in PARENTS[table]),
        ]
        self.db.execute(
            f"UPDATE {table} SET {','.join(assignments)} WHERE id=?",
            [encode(data), now(), *(data.get(f) for f in PARENTS[table]), record["id"]],
        )

    def update(
        self, table: str, record_id: str, patch: dict[str, Any], revision: int
    ) -> dict[str, Any]:
        """Apply patches with optimistic concurrency; never rewrite snapshots."""
        self._table(table)
        positive_revision(revision)
        if not isinstance(patch, dict) or {"snapshot", "origin"} & set(patch):
            raise ValidationError("Cannot edit server-managed data.")
        with self.transaction():
            record = self.get(table, record_id)
            if record["revision"] != revision:
                raise ConflictError("Record was changed; reload before editing.")
            clean = validate_data(
                table,
                clean_master_data(table, {**record["data"], **patch}),
                internal=True,
            )
            if table in (
                "varieties",
                "cultivations",
                "growing_windows",
                "cultivation_events",
            ):
                immutable = {"plant_id", "variety_id", "cultivation_id"} & set(
                    PARENTS[table]
                )
                if table == "growing_windows":
                    immutable.discard("variety_id")
                if any(clean.get(k) != record["data"].get(k) for k in immutable):
                    raise ValidationError(
                        "Historical parent references cannot be reassigned."
                    )
            if (
                table == "cultivation_events"
                and record["data"].get("origin") == "initial"
            ):
                if set(patch) - {"notes"}:
                    raise ValidationError(
                        "Edit initial date/status through its cultivation."
                    )
            if table == "cultivations" and clean.get("location_id") != record[
                "data"
            ].get("location_id"):
                tasks = self.list_records("tasks", {"cultivation_id": record_id})
                if any(
                    t["data"].get("location_id") is not None
                    and t["data"]["location_id"] != clean.get("location_id")
                    for t in tasks
                ):
                    raise ConflictError(
                        "Unlink explicit task locations before moving a culture."
                    )
            self._write(table, record, clean)
            if table == "cultivations" and {"date", "initial_status"} & set(patch):
                for event in self.list_records(
                    "cultivation_events", {"cultivation_id": record_id}
                ):
                    if event["data"].get("origin") == "initial":
                        updated = {
                            **event["data"],
                            "date": clean["date"],
                            "status": clean["initial_status"],
                        }
                        self._write("cultivation_events", event, updated)
            self._touch(record["revision"] + 1)
        return self.get(table, record_id)

    def delete(
        self, table: str, record_id: str, revision: int, *, confirm: bool = False
    ) -> None:
        """Never cascade-delete history; all deletions require explicit confirmation."""
        self._table(table)
        if confirm is not True:
            raise ValidationError("Deletion requires explicit confirmation.")
        positive_revision(revision)
        try:
            with self.transaction():
                record = self.get(table, record_id)
                if record["revision"] != revision:
                    raise ConflictError("Record was changed; reload before deleting.")
                if (
                    table == "cultivation_events"
                    and record["data"].get("origin") == "initial"
                ):
                    raise ConflictError("Initial lifecycle event must be retained.")
                if table == "cultivations":
                    self.db.execute(
                        "DELETE FROM cultivation_events WHERE cultivation_id=?",
                        (record_id,),
                    )
                self.db.execute(f"DELETE FROM {table} WHERE id=?", (record_id,))
                self._touch()
        except sqlite3.IntegrityError as err:
            raise ConflictError(
                "Record has dependent history; archive or unlink instead."
            ) from err

    def duplicate_plant(self, record_id: str, name: str) -> dict[str, Any]:
        """Copy a plant and general windows without historical observations."""
        original = self.get("plants", record_id)
        data = validate_data(
            "plants", {**original["data"], "name": name, "archived": False}
        )
        with self.transaction():
            result = self._new("plants", data)
            for window in self.list_records("growing_windows", {"plant_id": record_id}):
                if not window["data"].get("variety_id"):
                    self._new(
                        "growing_windows", {**window["data"], "plant_id": result["id"]}
                    )
            self._touch()
        return result

    def _histories(self, cultures: list[dict[str, Any]]) -> list[dict[str, Any]]:
        grouped: dict[str, list[dict[str, Any]]] = {}
        for event in self.list_records("cultivation_events"):
            grouped.setdefault(event["data"]["cultivation_id"], []).append(event)
        result = []
        for record in cultures:
            events = sorted(
                grouped.get(record["id"], []),
                key=lambda e: (e["data"]["date"], e["created_at"], e["id"]),
            )
            sown = [e["data"]["date"] for e in events if e["data"]["status"] == "sown"]
            result.append(
                {
                    **record,
                    "events": events,
                    "sowing_date": sown[0] if sown else None,
                    "status": events[-1]["data"]["status"]
                    if events
                    else record["data"].get("initial_status", "sown"),
                }
            )
        return sorted(
            result,
            key=lambda r: (r["sowing_date"] or r["data"]["date"], r["id"]),
            reverse=True,
        )

    def history(self, plant_id: str) -> list[dict[str, Any]]:
        """Return observed sowing dates, lifecycle and unchanged historical context."""
        self.get("plants", plant_id)
        return self._histories(
            self.list_records("cultivations", {"plant_id": plant_id})
        )

    def summary(self) -> dict[str, int]:
        """Aggregate explicit state; success is independent of lifecycle completion."""
        cultures = self._histories(self.list_records("cultivations"))
        return {
            "plants": sum(
                not p["data"].get("archived", False)
                for p in self.list_records("plants")
            ),
            "planned": sum(c["status"] == "planned" for c in cultures),
            "active": sum(
                c["status"] not in ("planned", "completed", "failed") for c in cultures
            ),
            "successful": sum(
                c["data"].get("result") == "successful" for c in cultures
            ),
            "open_tasks": sum(
                not t["data"].get("completed", False)
                for t in self.list_records("tasks")
            ),
        }

    def export_data(self) -> dict[str, Any]:
        """Export relational records, IDs, snapshots and revisions losslessly."""
        return {
            "format_version": FORMAT_VERSION,
            "schema_version": SCHEMA_VERSION,
            "exported_at": now(),
            "tables": {t: self.list_records(t) for t in TABLES},
        }

    def _read_import(self, payload: Any) -> dict[str, list[dict[str, Any]]]:
        if len(encode(payload).encode()) > MAX_IMPORT_BYTES:
            raise ValidationError("Import exceeds 20 MiB.")
        if not isinstance(payload, dict) or set(payload) != {
            "format_version",
            "schema_version",
            "exported_at",
            "tables",
        }:
            raise ValidationError("Invalid export envelope.")
        if (
            type(payload["format_version"]) is not int
            or payload["format_version"] != FORMAT_VERSION
        ):
            raise ValidationError("Unsupported exchange format version.")
        if (
            type(payload["schema_version"]) is not int
            or not 1 <= payload["schema_version"] <= SCHEMA_VERSION
        ):
            raise ValidationError("Unsupported exchange schema version.")
        timestamp(payload["exported_at"])
        tables = payload["tables"]
        if not isinstance(tables, dict) or set(tables) != set(TABLES):
            raise ValidationError("Import must include every known table.")
        if any(not isinstance(tables[t], list) for t in TABLES):
            raise ValidationError("Each import table must be a list.")
        if sum(len(tables[t]) for t in TABLES) > MAX_RECORDS:
            raise ValidationError("Too many imported records.")
        result: dict[str, list[dict[str, Any]]] = {}
        for table in TABLES:
            seen: set[str] = set()
            result[table] = []
            for record in tables[table]:
                if not isinstance(record, dict) or set(record) != {
                    "id",
                    "revision",
                    "created_at",
                    "updated_at",
                    "data",
                }:
                    raise ValidationError("Invalid imported record envelope.")
                rid = identifier(record["id"])
                if rid in seen:
                    raise ValidationError("Duplicate record ID in import.")
                seen.add(rid)
                positive_revision(record["revision"])
                timestamp(record["created_at"])
                timestamp(record["updated_at"])
                clean = validate_data(
                    table, clean_master_data(table, record["data"]), internal=True
                )
                if table == "cultivations" and "snapshot" not in clean:
                    raise ValidationError(
                        "Imported culture lacks its historical snapshot."
                    )
                result[table].append({**record, "data": clean})
        return result

    def _plan(
        self, payload: Any, mode: str
    ) -> tuple[dict[str, list[dict[str, Any]]], dict[str, Any]]:
        if mode not in {"merge", "replace"}:
            raise ValidationError("Import mode must be merge or replace.")
        tables = self._read_import(payload)
        current = {t: {r["id"]: r for r in self.list_records(t)} for t in TABLES}
        desired = {t: dict(current[t]) if mode == "merge" else {} for t in TABLES}
        conflicts = []
        inserted = skipped = updated = 0
        for table in TABLES:
            for record in tables[table]:
                previous = current[table].get(record["id"])
                if mode == "merge" and previous is not None:
                    if encode(previous) != encode(record):
                        conflicts.append({"table": table, "id": record["id"]})
                    else:
                        skipped += 1
                else:
                    inserted += int(previous is None)
                    updated += int(
                        previous is not None and encode(previous) != encode(record)
                    )
                desired[table][record["id"]] = record
        for table in TABLES:
            for record in desired[table].values():
                data = record["data"]
                for field, target in PARENTS[table].items():
                    if (
                        data.get(field) is not None
                        and data[field] not in desired[target]
                    ):
                        raise ValidationError(
                            "Import contains a dangling relationship."
                        )
                if data.get("variety_id") and desired["varieties"][data["variety_id"]][
                    "data"
                ]["plant_id"] != data.get("plant_id"):
                    raise ValidationError(
                        "Imported variety belongs to a different plant."
                    )
                if table == "tasks" and data.get("cultivation_id"):
                    parent = desired["cultivations"][data["cultivation_id"]]["data"]
                    if any(
                        data.get(k) is not None and data[k] != parent.get(k)
                        for k in ("plant_id", "location_id")
                    ):
                        raise ValidationError("Imported task relationships disagree.")
        initial_events: dict[str, list[dict[str, Any]]] = {}
        for event in desired["cultivation_events"].values():
            if event["data"].get("origin") == "initial":
                initial_events.setdefault(event["data"]["cultivation_id"], []).append(
                    event
                )
        for culture in desired["cultivations"].values():
            initial = initial_events.get(culture["id"], [])
            if (
                len(initial) != 1
                or initial[0]["data"]["date"] != culture["data"]["date"]
                or initial[0]["data"]["status"]
                != culture["data"].get("initial_status", "sown")
            ):
                raise ValidationError(
                    "Each culture requires one matching initial event."
                )
        generation = self.db.execute(
            "SELECT value FROM settings WHERE key='generation'"
        ).fetchone()[0]
        token = hashlib.sha256(
            encode(
                {"payload": payload, "mode": mode, "generation": generation}
            ).encode()
        ).hexdigest()
        deleted = sum(len(set(current[t]) - set(desired[t])) for t in TABLES)
        return tables, {
            "token": token,
            "mode": mode,
            "inserted": inserted,
            "skipped": skipped,
            "updated": updated,
            "deleted": deleted,
            "conflicts": conflicts,
            "counts": {t: len(desired[t]) for t in TABLES},
        }

    def preview_import(self, payload: Any, mode: str = "merge") -> dict[str, Any]:
        """Dry-run with no writes; token binds payload, mode and current state."""
        return self._plan(payload, mode)[1]

    def import_data(
        self, payload: Any, token: str, mode: str = "merge"
    ) -> dict[str, Any]:
        """Apply a reviewed import atomically; merge never overwrites differences."""
        with self.transaction():
            tables, plan = self._plan(payload, mode)
            if token != plan["token"]:
                raise ConflictError("Import preview expired; preview again.")
            if plan["conflicts"]:
                raise ConflictError(
                    "Merge would overwrite existing records; resolve conflicts first."
                )
            if mode == "replace":
                self.backup("before-replace", in_transaction=True)
                for table in reversed(TABLES):
                    self.db.execute(f"DELETE FROM {table}")
            generation = int(
                self.db.execute(
                    "SELECT value FROM settings WHERE key='generation'"
                ).fetchone()[0]
            )
            highest_revision = generation
            for table in TABLES:
                existing = {r["id"] for r in self.list_records(table)}
                for record in tables[table]:
                    if record["id"] not in existing:
                        if mode == "replace":
                            record = {
                                **record,
                                "revision": max(generation, record["revision"]) + 1,
                            }
                        highest_revision = max(highest_revision, record["revision"])
                        self._insert(table, record)
            self._touch(highest_revision)
        return plan

    def backup(self, reason: str = "manual", *, in_transaction: bool = False) -> str:
        """Create a standalone consistent backup, never copy an active WAL file."""
        folder = self.directory / "backups"
        folder.mkdir(exist_ok=True, mode=0o700)
        if reason not in {"manual", "before-migration", "before-replace"}:
            raise ValidationError("Unknown backup reason.")
        name = f"{reason}-{uuid4().hex}.sqlite3"
        target = folder / name
        # A second read connection sees the committed pre-transaction state.
        source = (
            sqlite3.connect(f"{self.path.as_uri()}?mode=ro", uri=True)
            if in_transaction
            else self.db
        )
        try:
            with closing(sqlite3.connect(target)) as destination:
                source.backup(destination)
            target.chmod(0o600)
        finally:
            if in_transaction:
                source.close()
        return name

    def claim_reminder(self, key: str, description: str) -> bool:
        """Reserve before sending; never automatically retry uncertain attempts."""
        if (
            not isinstance(key, str)
            or len(key) > 200
            or not isinstance(description, str)
        ):
            raise ValidationError("Invalid reminder key.")
        with self.transaction():
            cursor = self.db.execute(
                "INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)",
                (
                    "delivery:" + key,
                    encode(
                        {"state": "reserved", "description": description, "at": now()}
                    ),
                ),
            )
            return cursor.rowcount == 1

    def finish_reminder(self, key: str, state: str) -> None:
        """Record a definite result while retaining reservations across restarts."""
        if state not in {"sent", "uncertain"}:
            raise ValidationError("Invalid reminder state.")
        self.db.execute(
            "UPDATE settings SET value=json_set(value, '$.state', ?) WHERE key=?",
            (state, "delivery:" + key),
        )

    def reminder_log(self) -> list[dict[str, Any]]:
        """Keep delivery state separate from garden imports to prevent duplicates."""
        return [
            json.loads(row[0])
            for row in self.db.execute(
                "SELECT value FROM settings WHERE key LIKE 'delivery:%' "
                "ORDER BY json_extract(value, '$.at') DESC LIMIT 200"
            )
        ]

    def list_backups(self) -> list[str]:
        """Expose generated names only, not arbitrary filesystem browsing."""
        folder = self.directory / "backups"
        return sorted(
            p.name
            for p in folder.glob("*.sqlite3")
            if p.is_file() and not p.is_symlink()
        )

    def read_backup(self, name: str) -> dict[str, Any]:
        """Validate a managed backup without replacing the live connection."""
        if name not in self.list_backups() or Path(name).name != name:
            raise ValidationError("Unknown managed backup.")
        path = self.directory / "backups" / name
        with closing(sqlite3.connect(f"{path.as_uri()}?mode=ro", uri=True)) as source:
            source.row_factory = sqlite3.Row
            if (
                source.execute("PRAGMA application_id").fetchone()[0] != APPLICATION_ID
                or not 1
                <= source.execute("PRAGMA user_version").fetchone()[0]
                <= SCHEMA_VERSION
            ):
                raise ValidationError("Backup schema is not supported for restore.")
            if (
                source.execute("PRAGMA integrity_check").fetchone()[0] != "ok"
                or source.execute("PRAGMA foreign_key_check").fetchone()
            ):
                raise ValidationError("Backup integrity check failed.")
            if source.execute("PRAGMA user_version").fetchone()[0] < SCHEMA_VERSION:
                with TemporaryDirectory(prefix="garden-planner-restore-") as temp:
                    directory = Path(temp)
                    with closing(
                        sqlite3.connect(directory / "garden_planner.sqlite3")
                    ) as target:
                        source.backup(target)
                    migrated = Database(directory)
                    try:
                        migrated.open()
                        payload = migrated.export_data()
                        payload["exported_at"] = "2000-01-01T00:00:00+00:00"
                        return payload
                    finally:
                        migrated.close()
            return {
                "format_version": FORMAT_VERSION,
                "schema_version": SCHEMA_VERSION,
                "exported_at": "2000-01-01T00:00:00+00:00",
                "tables": {
                    t: [
                        self._record(row)
                        for row in source.execute(f"SELECT * FROM {t} ORDER BY id")
                    ]
                    for t in TABLES
                },
            }

    def preview_restore(self, name: str) -> dict[str, Any]:
        """Require a separate review before destructive restoration."""
        return self.preview_import(self.read_backup(name), "replace")

    def restore(self, name: str, token: str) -> dict[str, Any]:
        """Restore validated records transactionally, with a pre-restore backup."""
        return self.import_data(self.read_backup(name), token, "replace")
