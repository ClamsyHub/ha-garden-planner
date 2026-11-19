"""Persistent stock and journal, old imports and atomic schema upgrade."""

import csv
import io
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from typing import Any
from unittest.mock import patch

from custom_components.garden_planner.exchange import export_csv, import_csv
from custom_components.garden_planner.models import (
    LEGACY_TABLES,
    SCHEMA_VERSION,
    TABLES,
    ConflictError,
    ValidationError,
)
from custom_components.garden_planner.storage.database import Database
from custom_components.garden_planner.storage.schema import MIGRATIONS


class StockJournalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.db = Database(self.directory)
        self.db.open()
        self.addCleanup(self.db.close)
        self.plant = self.db.create("plants", {"name": "Tomato"})
        self.bed = self.db.create("locations", {"name": "Bed A"})
        self.culture = self.db.create(
            "cultivations",
            {
                "plant_id": self.plant["id"],
                "location_id": self.bed["id"],
                "date": "2026-04-01",
                "method": "direct",
                "quantity": 100,
                "plant_count": 20,
            },
        )

    def lot(self, **extra: object) -> dict[str, Any]:
        return self.db.create(
            "seed_lots",
            {
                "plant_id": self.plant["id"],
                "lot_label": "Packet 2024",
                "quantity": 30,
                "unit": "seeds",
                "purchase_year": 2024,
                "best_before": "2027-12-31",
                "opened_on": "2026-03-01",
                "germination_percent": 85,
                "germination_tested_on": "2026-02-10",
                "storage_location": "Box A",
                **extra,
            },
        )

    def harvest(self, **extra: object) -> dict[str, Any]:
        return self.db.create(
            "cultivation_journal",
            {
                "cultivation_id": self.culture["id"],
                "date": "2026-08-01",
                "entry_kind": "harvest",
                "amount": 10,
                "unit": "kg",
                **extra,
            },
        )

    def test_multiple_lots_independent_from_status_and_correctable_variety(
        self,
    ) -> None:
        a = self.lot()
        b = self.lot(lot_label="New packet", quantity=1.5, unit="g")
        variety = self.db.create(
            "varieties", {"plant_id": self.plant["id"], "name": "Roma"}
        )
        changed = self.db.update(
            "seed_lots",
            a["id"],
            {"variety_id": variety["id"], "quantity": 20},
            a["revision"],
        )
        self.assertEqual(changed["data"]["quantity"], 20)
        self.assertNotIn("seed_state", self.db.get("plants", self.plant["id"])["data"])
        self.db.close()
        self.db.open()
        self.assertEqual(
            self.db.get("seed_lots", b["id"])["data"]["storage_location"], "Box A"
        )
        self.db.delete("seed_lots", changed["id"], changed["revision"], confirm=True)
        self.assertEqual(len(self.db.list_records("seed_lots")), 1)

    def test_stock_and_harvest_validation_has_no_partial_writes(self) -> None:
        changes: dict[str, Any]
        for changes in (
            {"quantity": -1},
            {"quantity": 1.5},
            {"unit": []},
            {"purchase_year": True},
            {"germination_percent": 101},
            {"best_before": "2026-02-30"},
        ):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                self.lot(**changes)
        for changes in (
            {"amount": 0},
            {"amount": -2},
            {"amount": 1.5, "unit": "pieces"},
            {"unit": []},
            {"amount": 0.0001, "unit": "g"},
            {"harvest_context": {}},
            {"cultivation_id": "missing"},
        ):
            with self.subTest(changes=changes):
                from custom_components.garden_planner.models import PlannerError

                with self.assertRaises(PlannerError):
                    self.harvest(**changes)
        self.assertEqual(self.db.list_records("seed_lots"), [])
        self.assertEqual(self.db.list_records("cultivation_journal"), [])

    def test_harvest_context_is_frozen_and_records_remain_editable(self) -> None:
        first = self.harvest()
        other = self.db.create("locations", {"name": "Bed B"})
        self.db.update(
            "cultivations",
            self.culture["id"],
            {"location_id": other["id"]},
            self.culture["revision"],
        )
        second = self.harvest(amount=500, unit="g", date="2027-01-02")
        self.assertEqual(first["data"]["harvest_context"]["location_name"], "Bed A")
        self.assertEqual(second["data"]["harvest_context"]["location_name"], "Bed B")
        changed = self.db.update(
            "cultivation_journal", first["id"], {"amount": 12}, first["revision"]
        )
        self.assertEqual(
            changed["data"]["harvest_context"], first["data"]["harvest_context"]
        )
        with self.assertRaises(ValidationError):
            self.db.update(
                "cultivation_journal",
                first["id"],
                {"harvest_context": second["data"]["harvest_context"]},
                changed["revision"],
            )
        with self.assertRaises(ConflictError):
            self.db.update(
                "cultivation_journal", first["id"], {"amount": 15}, first["revision"]
            )
        self.db.delete(
            "cultivation_journal", second["id"], second["revision"], confirm=True
        )
        self.assertEqual(len(self.db.list_records("cultivation_journal")), 1)

    def test_journal_does_not_modify_lifecycle_and_parent_cannot_change(self) -> None:
        entry = self.db.create(
            "cultivation_journal",
            {
                "cultivation_id": self.culture["id"],
                "date": "2026-05-01",
                "entry_kind": "pest",
                "notes": "Observed aphids",
            },
        )
        self.assertEqual(len(self.db.list_records("cultivation_events")), 1)
        with self.assertRaises(ValidationError):
            self.db.update(
                "cultivation_journal",
                entry["id"],
                {"entry_kind": "harvest", "amount": 1, "unit": "kg"},
                entry["revision"],
            )
        self.assertEqual(self.db.get("cultivation_journal", entry["id"]), entry)

    def test_full_export_restore_and_legacy_json_csv(self) -> None:
        self.lot()
        self.harvest()
        data = self.db.export_data()
        self.assertEqual(import_csv(export_csv(data))["tables"], data["tables"])
        name = self.db.backup()
        self.db.create(
            "seed_lots",
            {
                "plant_id": self.plant["id"],
                "lot_label": "Temporary",
                "quantity": 0,
                "unit": "packets",
            },
        )
        preview = self.db.preview_restore(name)
        self.db.restore(name, preview["token"])
        self.assertEqual(
            {
                t: [(r["id"], r["data"]) for r in rows]
                for t, rows in self.db.export_data()["tables"].items()
            },
            {
                t: [(r["id"], r["data"]) for r in rows]
                for t, rows in data["tables"].items()
            },
        )
        old = {
            **data,
            "schema_version": 3,
            "tables": {t: data["tables"][t] for t in LEGACY_TABLES},
        }
        for c in old["tables"]["cultivations"]:
            c["data"].pop("plant_count", None)
        oldfiles = {
            k: v
            for k, v in export_csv(
                old
                | {
                    "tables": {
                        **old["tables"],
                        **{t: [] for t in TABLES if t not in LEGACY_TABLES},
                    }
                }
            ).items()
            if k in {"metadata.json", *(f"{t}.csv" for t in LEGACY_TABLES)}
        }
        rows = list(csv.reader(io.StringIO(oldfiles["cultivations.csv"])))
        index = rows[0].index("plant_count")
        for row in rows:
            row.pop(index)
        output = io.StringIO()
        csv.writer(output).writerows(rows)
        oldfiles["cultivations.csv"] = output.getvalue()
        for payload in (old, import_csv(oldfiles)):
            plan = self.db.preview_import(payload, "replace")
            self.db.import_data(payload, plan["token"], "replace")
            self.assertEqual(self.db.list_records("seed_lots"), [])
            self.assertEqual(self.db.list_records("cultivation_journal"), [])

    def test_schema_three_migration_and_failure_are_atomic(self) -> None:
        self.db.close()
        with closing(sqlite3.connect(self.directory / "garden_planner.sqlite3")) as con:
            con.execute("DROP TABLE bed_plantings")
            con.execute("DROP TABLE bed_layouts")
            con.execute("DROP TABLE cultivation_journal")
            con.execute("DROP TABLE seed_lots")
            con.execute("DELETE FROM schema_migrations WHERE version>=4")
            con.execute("PRAGMA user_version=3")
            con.commit()
        with patch.dict(
            MIGRATIONS, {4: ["CREATE TABLE broken (id INTEGER)", "INVALID SQL"]}
        ):
            with self.assertRaises(sqlite3.Error):
                self.db.open()
        with closing(sqlite3.connect(self.directory / "garden_planner.sqlite3")) as con:
            self.assertEqual(con.execute("PRAGMA user_version").fetchone()[0], 3)
            self.assertFalse(
                con.execute(
                    "SELECT name FROM sqlite_master WHERE name='broken'"
                ).fetchone()
            )
        self.db.open()
        self.assertEqual(self.db.get("cultivations", self.culture["id"]), self.culture)
        self.assertEqual(
            self.db.db.execute("PRAGMA user_version").fetchone()[0], SCHEMA_VERSION
        )
        self.assertTrue(self.db.list_backups())
