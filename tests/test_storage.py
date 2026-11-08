"""Behavioral tests with real SQLite files, transactions and worker threads."""

import asyncio
import copy
import json
import sqlite3
import tempfile
import threading
import time
import unittest
from contextlib import closing
from datetime import date
from pathlib import Path
from typing import Any
from unittest.mock import patch

from custom_components.garden_planner.calendar_math import contains_day, next_window_day
from custom_components.garden_planner.exchange import export_csv, import_csv
from custom_components.garden_planner.models import (
    PLANT_MEASURE_FIELDS,
    SCHEMA_VERSION,
    ConflictError,
    NotFoundError,
    StorageError,
    ValidationError,
)
from custom_components.garden_planner.storage import Database, PlannerWorker
from custom_components.garden_planner.storage.database import now
from custom_components.garden_planner.storage.schema import APPLICATION_ID, MIGRATIONS


class StorageTests(unittest.TestCase):
    """Protect user observations across edits, exchanges and restoration."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.db = Database(self.directory)
        self.db.open()
        self.addCleanup(self.db.close)
        self.plant = self.db.create(
            "plants", {"name": "Test crop", "notes": "Original"}
        )

    def culture(self, day: str = "2026-09-12") -> dict[str, Any]:
        return self.db.create(
            "cultivations",
            {
                "plant_id": self.plant["id"],
                "date": day,
                "method": "direct",
                "notes": "Observed growth",
                "temperature_c": 13,
                "measurement_kind": "soil",
            },
        )

    def test_multiple_sowings_and_restart_keep_history(self) -> None:
        self.culture()
        self.culture("2026-09-20")
        later = self.culture("2027-09-05")
        self.db.create(
            "cultivation_events",
            {
                "cultivation_id": later["id"],
                "date": "2027-09-15",
                "status": "germinated",
                "notes": "Observed",
            },
        )
        self.db.close()
        self.db.open()
        history = self.db.history(self.plant["id"])
        self.assertEqual(len(history), 3)
        self.assertEqual(history[0]["status"], "germinated")
        self.assertEqual(len(history[0]["events"]), 2)
        self.assertEqual(len(self.db.list_records("cultivations", {"year": 2026})), 2)

    def test_snapshot_survives_master_data_changes(self) -> None:
        culture = self.culture()
        self.db.update("plants", self.plant["id"], {"name": "Renamed"}, 1)
        saved = self.db.get("cultivations", culture["id"])
        self.assertEqual(saved["data"]["snapshot"]["plant"]["name"], "Test crop")
        self.assertEqual(
            self.db.get("plants", self.plant["id"])["data"]["name"], "Renamed"
        )
        with self.assertRaises(ValidationError):
            self.db.update("cultivations", culture["id"], {"snapshot": {}}, 1)

    def test_out_of_order_events_sorted_by_gardening_date(self) -> None:
        culture = self.culture()
        self.db.create(
            "cultivation_events",
            {
                "cultivation_id": culture["id"],
                "date": "2026-10-10",
                "status": "harvesting",
            },
        )
        self.db.create(
            "cultivation_events",
            {
                "cultivation_id": culture["id"],
                "date": "2026-09-20",
                "status": "germinated",
            },
        )
        self.assertEqual(self.db.history(self.plant["id"])[0]["status"], "harvesting")
        self.assertEqual(self.db.summary()["successful"], 0)

    def test_initial_event_tracks_date_edits(self) -> None:
        culture = self.culture()
        self.db.update("cultivations", culture["id"], {"date": "2026-09-13"}, 1)
        event = self.db.history(self.plant["id"])[0]["events"][0]
        self.assertEqual(event["data"]["date"], "2026-09-13")
        with self.assertRaises(ConflictError):
            self.db.delete(
                "cultivation_events", event["id"], event["revision"], confirm=True
            )
        with self.assertRaises(ValidationError):
            self.db.update(
                "cultivation_events",
                event["id"],
                {"date": "2026-09-14"},
                event["revision"],
            )

    def test_live_masters_discard_retired_traits_and_window_varieties(self) -> None:
        variety = self.db.create(
            "varieties",
            {
                "plant_id": self.plant["id"],
                "name": "Variety",
                **{key: 1 for key in PLANT_MEASURE_FIELDS},
            },
        )
        self.assertFalse(PLANT_MEASURE_FIELDS & variety["data"].keys())
        window = self.db.create(
            "growing_windows",
            {
                "plant_id": self.plant["id"],
                "variety_id": variety["id"],
                "activity": "direct",
                "environment": "outdoors",
                "start_month": 9,
                "start_day": 1,
                "end_month": 10,
                "end_day": 31,
            },
        )
        self.assertNotIn("variety_id", window["data"])
        window = self.db.update(
            "growing_windows",
            window["id"],
            {"variety_id": variety["id"], "notes": "Applies to the plant"},
            window["revision"],
        )
        self.assertNotIn("variety_id", window["data"])
        updated = self.db.update(
            "varieties",
            variety["id"],
            {"depth_cm": 2, "notes": "Preserved"},
            variety["revision"],
        )
        self.assertNotIn("depth_cm", updated["data"])
        self.assertEqual(updated["data"]["notes"], "Preserved")
        self.assertIsNone(
            self.db.db.execute(
                "SELECT variety_id FROM growing_windows WHERE id=?", (window["id"],)
            ).fetchone()[0]
        )

    def test_stale_edits_and_deletes_rejected(self) -> None:
        self.db.update("plants", self.plant["id"], {"notes": "First edit"}, 1)
        with self.assertRaises(ConflictError):
            self.db.update("plants", self.plant["id"], {"notes": "Stale edit"}, 1)
        with self.assertRaises(ConflictError):
            self.db.delete("plants", self.plant["id"], 1, confirm=True)
        self.assertEqual(
            self.db.get("plants", self.plant["id"])["data"]["notes"], "First edit"
        )

    def test_archive_and_delete_preserve_relationships(self) -> None:
        self.culture()
        with self.assertRaises(ConflictError):
            self.db.delete("plants", self.plant["id"], 1, confirm=True)
        self.db.update("plants", self.plant["id"], {"archived": True}, 1)
        self.assertEqual(len(self.db.history(self.plant["id"])), 1)
        with self.assertRaises(ValidationError):
            self.culture("2028-09-01")
        other = self.db.create("plants", {"name": "Unused"})
        with self.assertRaises(ValidationError):
            self.db.delete("plants", other["id"], 1)
        self.db.delete("plants", other["id"], 1, confirm=True)
        with self.assertRaises(NotFoundError):
            self.db.get("plants", other["id"])

    def test_invalid_values_and_cross_plant_variety(self) -> None:
        cases: list[dict[str, Any]] = [
            {"name": " "},
            {"name": "A", "spacing_cm": -1},
            {"name": "A", "depth_cm": True},
            {"name": "A", "depth_cm": float("nan")},
            {"name": "A", "germination_min_c": 30, "germination_max_c": 10},
            {"name": "A", "typo": "discarded?"},
        ]
        for data in cases:
            with self.subTest(data=data), self.assertRaises(ValidationError):
                self.db.create("plants", data)
        other = self.db.create("plants", {"name": "Other crop"})
        variety = self.db.create(
            "varieties", {"plant_id": other["id"], "name": "Variety"}
        )
        with self.assertRaises(ValidationError):
            self.db.create(
                "cultivations",
                {
                    "plant_id": self.plant["id"],
                    "variety_id": variety["id"],
                    "date": "2026-09-01",
                    "method": "direct",
                },
            )
        for data in (
            {"plant_id": self.plant["id"], "date": "2026-02-30", "method": "direct"},
            {
                "plant_id": self.plant["id"],
                "date": "2026-09-01",
                "method": "direct",
                "temperature_c": 20,
            },
        ):
            with self.assertRaises(ValidationError):
                self.db.create("cultivations", data)
        self.assertEqual(self.db.list_records("cultivations"), [])

    def test_location_sensor_and_unassigned_culture(self) -> None:
        with self.assertRaises(ValidationError):
            self.db.create(
                "locations", {"name": "Bed", "sensor_entity_id": "sensor.test"}
            )
        location = self.db.create(
            "locations",
            {
                "name": "Bed",
                "sensor_entity_id": "sensor.test",
                "measurement_kind": "air",
            },
        )
        self.assertEqual(location["data"]["measurement_kind"], "air")
        self.assertNotIn("location_id", self.culture()["data"])

    def test_sql_injection_is_text_and_table_names_restricted(self) -> None:
        record = self.db.create("plants", {"name": "'); DROP TABLE plants; --"})
        self.assertEqual(
            self.db.get("plants", record["id"])["data"]["name"],
            "'); DROP TABLE plants; --",
        )
        with self.assertRaises(ValidationError):
            self.db.list_records("plants; DROP TABLE plants")
        self.assertEqual(len(self.db.list_records("plants")), 2)

    def test_duplicate_copies_general_windows_not_history(self) -> None:
        self.db.create(
            "growing_windows",
            {
                "plant_id": self.plant["id"],
                "activity": "direct",
                "environment": "outdoors",
                "start_month": 8,
                "start_day": 20,
                "end_month": 10,
                "end_day": 1,
            },
        )
        self.culture()
        duplicate = self.db.duplicate_plant(self.plant["id"], "Copy")
        self.assertEqual(
            len(self.db.list_records("growing_windows", {"plant_id": duplicate["id"]})),
            1,
        )
        self.assertEqual(self.db.history(duplicate["id"]), [])

    def test_json_and_csv_roundtrip_into_empty_database(self) -> None:
        self.culture()
        self.db.create(
            "tasks",
            {
                "title": "=Not a formula",
                "date": "2026-09-20",
                "activity": "care",
                "notes": 'Unicode ä, newline\nand comma, quote "',
            },
        )
        payload = self.db.export_data()
        csv_payload = import_csv(export_csv(payload))
        self.assertEqual(csv_payload, payload)
        target = Database(self.directory / "other")
        target.open()
        self.addCleanup(target.close)
        preview = target.preview_import(csv_payload)
        target.import_data(csv_payload, preview["token"])
        self.assertEqual(target.export_data()["tables"], payload["tables"])
        self.assertEqual(target.preview_import(payload)["inserted"], 0)

    def test_merge_conflicts_preview_expiry_and_atomic_invalid_import(self) -> None:
        payload = self.db.export_data()
        preview = self.db.preview_import(payload)
        self.culture()
        with self.assertRaises(ConflictError):
            self.db.import_data(payload, preview["token"])
        changed = copy.deepcopy(payload)
        changed["tables"]["plants"][0]["data"]["name"] = "Overwrite"
        plan = self.db.preview_import(changed)
        self.assertEqual(len(plan["conflicts"]), 1)
        with self.assertRaises(ConflictError):
            self.db.import_data(changed, plan["token"])
        bad = self.db.export_data()
        bad["tables"]["cultivations"][0]["data"]["plant_id"] = "missing"
        before = self.db.export_data()["tables"]
        with self.assertRaises(ValidationError):
            self.db.preview_import(bad, "replace")
        self.assertEqual(self.db.export_data()["tables"], before)

    def test_restore_consistent_backup_while_wal_is_active(self) -> None:
        self.culture()
        name = self.db.backup()
        saved = self.db.export_data()["tables"]
        self.db.update("plants", self.plant["id"], {"notes": "Changed since backup"}, 1)
        self.culture("2027-09-05")
        preview = self.db.preview_restore(name)
        self.db.restore(name, preview["token"])
        restored = self.db.export_data()["tables"]
        for table, records in saved.items():
            self.assertEqual(
                [r["data"] for r in restored[table]], [r["data"] for r in records]
            )
        with self.assertRaises(ConflictError):
            self.db.update(
                "plants", self.plant["id"], {"notes": "Stale before restore"}, 1
            )
        self.assertTrue(
            any(n.startswith("before-replace-") for n in self.db.list_backups())
        )
        with self.assertRaises(ValidationError):
            self.db.read_backup("../../garden_planner.sqlite3")

    def test_explicit_culture_delete_removes_owned_timeline_only(self) -> None:
        first = self.culture()
        second = self.culture("2027-09-05")
        self.db.delete("cultivations", first["id"], first["revision"], confirm=True)
        self.assertEqual(
            [c["id"] for c in self.db.history(self.plant["id"])], [second["id"]]
        )
        self.assertEqual(len(self.db.list_records("cultivation_events")), 1)

    def test_linked_task_blocks_culture_delete_without_losing_events(self) -> None:
        culture = self.culture()
        self.db.create(
            "tasks",
            {
                "title": "Care",
                "date": "2026-09-20",
                "activity": "care",
                "cultivation_id": culture["id"],
            },
        )
        with self.assertRaises(ConflictError):
            self.db.delete("cultivations", culture["id"], 1, confirm=True)
        self.assertEqual(len(self.db.history(self.plant["id"])[0]["events"]), 1)

    def test_planned_and_observed_sowing_dates_are_distinct(self) -> None:
        culture = self.db.create(
            "cultivations",
            {
                "plant_id": self.plant["id"],
                "date": "2026-09-01",
                "method": "direct",
                "initial_status": "planned",
            },
        )
        self.assertIsNone(self.db.history(self.plant["id"])[0]["sowing_date"])
        self.db.create(
            "cultivation_events",
            {
                "cultivation_id": culture["id"],
                "date": "2026-09-05",
                "status": "sown",
                "notes": "Actually sown",
            },
        )
        history = self.db.history(self.plant["id"])[0]
        self.assertEqual(history["sowing_date"], "2026-09-05")
        self.assertEqual(history["events"][0]["data"]["status"], "planned")

    def test_replace_import_failure_rolls_back_all_tables(self) -> None:
        self.culture()
        payload = self.db.export_data()
        payload["tables"]["plants"][0]["data"]["notes"] = "Replacement"
        plan = self.db.preview_import(payload, "replace")
        original = self.db._insert

        def fail_after_plant(table: str, record: dict[str, Any]) -> None:
            if table == "cultivations":
                raise StorageError("Simulated disk failure mid import")
            original(table, record)

        before = self.db.export_data()["tables"]
        with patch.object(self.db, "_insert", fail_after_plant):
            with self.assertRaises(StorageError):
                self.db.import_data(payload, plan["token"], "replace")
        self.assertEqual(self.db.export_data()["tables"], before)

    def test_malformed_exchange_is_rejected(self) -> None:
        original = self.db.export_data()
        malformed: list[Any] = [
            None,
            [],
            {**original, "schema_version": 999},
            {**original, "format_version": True},
        ]
        duplicate = copy.deepcopy(original)
        duplicate["tables"]["plants"] *= 2
        malformed.append(duplicate)
        for payload in malformed:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                self.db.preview_import(payload)
        files = export_csv(original)
        files["plants.csv"] = "bad,header\n"
        with self.assertRaises(ValidationError):
            import_csv(files)

    def test_write_failure_rolls_back_initial_culture_and_event(self) -> None:
        with patch.object(
            self.db, "_touch", side_effect=StorageError("Simulated failure")
        ):
            with self.assertRaises(StorageError):
                self.culture()
        self.assertEqual(self.db.list_records("cultivations"), [])
        self.assertEqual(self.db.list_records("cultivation_events"), [])


class MigrationTests(unittest.TestCase):
    """Exercise upgrade, failure rollback and future-schema refusal on disk."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.path = self.directory / "garden_planner.sqlite3"

    def legacy(self) -> None:
        with closing(sqlite3.connect(self.path)) as conn, conn:
            for statement in MIGRATIONS[1]:
                conn.execute(statement)
            conn.execute(f"PRAGMA application_id={APPLICATION_ID}")
            conn.execute("PRAGMA user_version=1")
            conn.execute("INSERT INTO schema_migrations VALUES (1, ?)", (now(),))
            conn.execute(
                "INSERT INTO plants VALUES (?,?,?,?,?)",
                ("old", 1, now(), now(), json.dumps({"name": "Preserved"})),
            )

    def legacy_two(self) -> dict[str, Any]:
        db = Database(self.directory)
        with patch(
            "custom_components.garden_planner.storage.database.SCHEMA_VERSION", 2
        ):
            db.open()
            try:
                plant = db.create(
                    "plants",
                    {
                        "name": "Chili example",
                        "germination_optimal_min_c": 20,
                        "germination_optimal_max_c": 25,
                    },
                )
                variety = db.create(
                    "varieties",
                    {
                        "plant_id": plant["id"],
                        "name": "Thai example",
                        "notes": "Keep this note",
                    },
                )
                window = db.create(
                    "growing_windows",
                    {
                        "plant_id": plant["id"],
                        "activity": "indoors",
                        "environment": "indoors",
                        "start_month": 1,
                        "start_day": 1,
                        "end_month": 12,
                        "end_day": 31,
                        "notes": "Keep the window",
                    },
                )
                old_variety = {
                    **variety["data"],
                    **{key: 1 for key in PLANT_MEASURE_FIELDS},
                }
                old_window = {
                    **window["data"],
                    "variety_id": variety["id"],
                    "germination_optimal_min_c": 21,
                    "germination_optimal_max_c": 24,
                }
                db.db.execute(
                    "UPDATE varieties SET data=? WHERE id=?",
                    (json.dumps(old_variety), variety["id"]),
                )
                db.db.execute(
                    "UPDATE growing_windows SET data=?, variety_id=? WHERE id=?",
                    (json.dumps(old_window), variety["id"], window["id"]),
                )
                culture = db.create(
                    "cultivations",
                    {
                        "plant_id": plant["id"],
                        "variety_id": variety["id"],
                        "date": "2026-02-01",
                        "method": "indoors",
                    },
                )
                old_data = {
                    **culture["data"],
                    "snapshot": {
                        **culture["data"]["snapshot"],
                        "variety": old_variety,
                        "windows": [old_window],
                    },
                }
                db.db.execute(
                    "UPDATE cultivations SET data=? WHERE id=?",
                    (json.dumps(old_data), culture["id"]),
                )
                return {
                    "plant": plant,
                    "variety": db.get("varieties", variety["id"]),
                    "window": db.get("growing_windows", window["id"]),
                    "culture": db.get("cultivations", culture["id"]),
                    "export": db.export_data(),
                }
            finally:
                db.close()

    def test_schema_three_cleans_only_live_masters_and_keeps_backup(self) -> None:
        before = self.legacy_two()
        db = Database(self.directory)
        db.open()
        self.addCleanup(db.close)
        variety = db.get("varieties", before["variety"]["id"])
        window = db.get("growing_windows", before["window"]["id"])
        self.assertFalse(PLANT_MEASURE_FIELDS & variety["data"].keys())
        self.assertEqual(variety["data"]["notes"], "Keep this note")
        self.assertEqual(variety["revision"], before["variety"]["revision"] + 1)
        self.assertNotIn("variety_id", window["data"])
        self.assertEqual(window["data"]["notes"], "Keep the window")
        self.assertEqual(db.get("plants", before["plant"]["id"]), before["plant"])
        self.assertEqual(
            db.get("cultivations", before["culture"]["id"]), before["culture"]
        )
        backup = self.directory / "backups" / db.list_backups()[0]
        with closing(sqlite3.connect(backup)) as copy:
            self.assertEqual(copy.execute("PRAGMA user_version").fetchone()[0], 2)
            self.assertIn(
                "depth_cm",
                json.loads(copy.execute("SELECT data FROM varieties").fetchone()[0]),
            )
        new = db.create(
            "cultivations",
            {
                "plant_id": before["plant"]["id"],
                "variety_id": variety["id"],
                "date": "2027-02-01",
                "method": "indoors",
            },
        )
        self.assertFalse(
            PLANT_MEASURE_FIELDS & new["data"]["snapshot"]["variety"].keys()
        )
        self.assertFalse(
            PLANT_MEASURE_FIELDS & new["data"]["snapshot"]["windows"][0].keys()
        )
        self.assertEqual(
            new["data"]["snapshot"]["plant"]["germination_optimal_min_c"], 20
        )

    def test_old_export_cannot_reintroduce_retired_live_fields(self) -> None:
        before = self.legacy_two()
        db = Database(self.directory / "imported")
        db.open()
        self.addCleanup(db.close)
        preview = db.preview_import(before["export"], "replace")
        db.import_data(before["export"], preview["token"], "replace")
        self.assertFalse(
            PLANT_MEASURE_FIELDS
            & db.get("varieties", before["variety"]["id"])["data"].keys()
        )
        self.assertNotIn(
            "variety_id", db.get("growing_windows", before["window"]["id"])["data"]
        )
        self.assertEqual(
            db.get("cultivations", before["culture"]["id"])["data"],
            before["culture"]["data"],
        )

    def test_schema_three_cleanup_rolls_back_on_failure(self) -> None:
        before = self.legacy_two()
        with patch.dict(MIGRATIONS, {3: [MIGRATIONS[3][0], "INVALID SQL"]}):
            with self.assertRaises(sqlite3.Error):
                Database(self.directory).open()
        with closing(sqlite3.connect(self.path)) as conn:
            self.assertEqual(conn.execute("PRAGMA user_version").fetchone()[0], 2)
            data = json.loads(conn.execute("SELECT data FROM varieties").fetchone()[0])
            self.assertEqual(data, before["variety"]["data"])

    def test_migration_preserves_records_and_preupgrade_backup(self) -> None:
        self.legacy()
        db = Database(self.directory)
        db.open()
        self.addCleanup(db.close)
        self.assertEqual(db.get("plants", "old")["data"]["name"], "Preserved")
        self.assertEqual(
            db.db.execute("PRAGMA user_version").fetchone()[0], SCHEMA_VERSION
        )
        backups = db.list_backups()
        self.assertEqual(len(backups), 1)
        with closing(
            sqlite3.connect(self.directory / "backups" / backups[0])
        ) as backup:
            self.assertEqual(backup.execute("PRAGMA user_version").fetchone()[0], 1)

    def test_pre_migration_backup_can_be_restored_via_private_copy(self) -> None:
        self.legacy()
        db = Database(self.directory)
        db.open()
        self.addCleanup(db.close)
        name = db.list_backups()[0]
        original = (self.directory / "backups" / name).read_bytes()
        db.update("plants", "old", {"name": "Changed"}, 1)
        preview = db.preview_restore(name)
        db.restore(name, preview["token"])
        self.assertEqual(db.get("plants", "old")["data"]["name"], "Preserved")
        self.assertEqual((self.directory / "backups" / name).read_bytes(), original)

    def test_migration_failure_rolls_back(self) -> None:
        self.legacy()
        with patch.dict(
            MIGRATIONS, {2: ["CREATE TABLE temp_migration (id INTEGER)", "INVALID SQL"]}
        ):
            with self.assertRaises(sqlite3.Error):
                Database(self.directory).open()
        with closing(sqlite3.connect(self.path)) as conn, conn:
            self.assertEqual(conn.execute("PRAGMA user_version").fetchone()[0], 1)
            self.assertFalse(
                conn.execute(
                    "SELECT name FROM sqlite_master WHERE name='temp_migration'"
                ).fetchall()
            )

    def test_newer_or_foreign_database_refused_without_changes(self) -> None:
        self.legacy()
        with closing(sqlite3.connect(self.path)) as conn, conn:
            conn.execute("PRAGMA user_version=999")
        before = self.path.read_bytes()
        with self.assertRaises(StorageError):
            Database(self.directory).open()
        self.assertEqual(self.path.read_bytes(), before)
        with closing(sqlite3.connect(self.path)) as conn, conn:
            conn.execute("PRAGMA user_version=1")
            conn.execute("PRAGMA application_id=0")
        before = self.path.read_bytes()
        with self.assertRaises(StorageError):
            Database(self.directory).open()
        self.assertEqual(self.path.read_bytes(), before)


class CalendarTests(unittest.TestCase):
    """Seasonal windows must not disappear or shift at year/leap boundaries."""

    def window(self, start: tuple[int, int], end: tuple[int, int]) -> dict[str, Any]:
        return {
            "plant_id": "test",
            "activity": "direct",
            "environment": "outdoors",
            "start_month": start[0],
            "start_day": start[1],
            "end_month": end[0],
            "end_day": end[1],
        }

    def test_winter_window(self) -> None:
        window = self.window((11, 15), (2, 10))
        self.assertTrue(contains_day(window, date(2027, 1, 5)))
        self.assertFalse(contains_day(window, date(2027, 6, 5)))
        self.assertEqual(next_window_day(window, date(2027, 3, 1)), date(2027, 11, 15))

    def test_leap_day_and_invalid_boundary(self) -> None:
        window = self.window((2, 29), (2, 29))
        self.assertEqual(next_window_day(window, date(2026, 1, 1)), date(2028, 2, 29))
        self.assertFalse(contains_day(window, date(2027, 2, 28)))
        with self.assertRaises(ValidationError):
            contains_day(self.window((2, 30), (3, 1)), date(2026, 1, 1))


class WorkerTests(unittest.IsolatedAsyncioTestCase):
    """Real worker serialization, event-loop responsiveness and shutdown."""

    async def asyncSetUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.worker = PlannerWorker(Path(self.temp.name))
        await self.worker.async_open()
        self.addAsyncCleanup(self.worker.async_close)

    async def test_parallel_edits_one_conflict(self) -> None:
        plant = await self.worker.async_call("create", "plants", {"name": "Shared"})
        results = await asyncio.gather(
            *(
                self.worker.async_call(
                    "update", "plants", plant["id"], {"notes": str(i)}, 1
                )
                for i in range(2)
            ),
            return_exceptions=True,
        )
        self.assertEqual(sum(isinstance(r, ConflictError) for r in results), 1)

    async def test_database_is_off_loop_and_close_rejects_later_requests(self) -> None:
        event_thread = threading.get_ident()
        original = Database.summary
        seen = []

        def slow_summary(db: Database) -> dict[str, int]:
            seen.append(threading.get_ident())
            time.sleep(0.05)
            return original(db)

        with patch.object(Database, "summary", slow_summary):
            task = asyncio.create_task(self.worker.async_call("summary"))
            await asyncio.sleep(0.005)
            self.assertFalse(task.done())
            await task
        self.assertNotEqual(seen, [event_thread])
        await self.worker.async_close()
        with self.assertRaises(StorageError):
            await self.worker.async_call("summary")

    async def test_cancelled_write_drains_before_shutdown(self) -> None:
        original = Database.create

        def slow_create(
            db: Database, table: str, data: dict[str, Any]
        ) -> dict[str, Any]:
            time.sleep(0.03)
            return original(db, table, data)

        with patch.object(Database, "create", slow_create):
            task = asyncio.create_task(
                self.worker.async_call("create", "plants", {"name": "Saved"})
            )
            await asyncio.sleep(0.005)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
        self.assertEqual(len(await self.worker.async_call("list_records", "plants")), 1)


if __name__ == "__main__":
    unittest.main()
