"""Geometry, durable planning, historical families and legacy schema upgrade."""

import copy
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from typing import Any
from unittest.mock import patch

from custom_components.garden_planner.exchange import export_csv, import_csv
from custom_components.garden_planner.models import (
    TABLES,
    ConflictError,
    ValidationError,
)
from custom_components.garden_planner.storage.database import Database
from custom_components.garden_planner.storage.schema import MIGRATIONS


class BedPlanTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = Database(Path(self.temp.name))
        self.db.open()
        self.addCleanup(self.db.close)
        self.bed = self.db.create("locations", {"name": "Bed"})
        self.plant = self.db.create("plants", {"name": "Pea", "family": "Fabaceae"})
        self.layout = self.db.create(
            "bed_layouts",
            {
                "location_id": self.bed["id"],
                "width_cm": 300,
                "height_cm": 200,
                "outline": [[0, 0], [300, 0], [300, 200], [0, 200]],
            },
        )

    def planting(self, **changes: Any) -> dict[str, Any]:
        return self.db.create(
            "bed_plantings",
            {
                "layout_id": self.layout["id"],
                "plant_id": self.plant["id"],
                "start_date": "2027-03-01",
                "end_date": "2027-05-31",
                "x_cm": 30,
                "y_cm": 30,
                "plant_count": 6,
                "columns": 3,
                "spacing_cm": 30,
                "row_spacing_cm": 40,
                "state": "planned",
                **changes,
            },
        )

    def test_shape_and_multiple_crops_persist_with_frozen_family(self) -> None:
        old = self.planting(
            state="completed", start_date="2025-03-01", end_date="2025-05-31"
        )
        next_crop = self.planting()
        self.db.update(
            "plants", self.plant["id"], {"family": "Changed"}, self.plant["revision"]
        )
        edited = self.db.update(
            "bed_plantings", old["id"], {"notes": "Historical crop"}, old["revision"]
        )
        self.assertEqual(edited["data"]["family_snapshot"], "Fabaceae")
        with self.assertRaises(ValidationError):
            self.db.update(
                "bed_plantings",
                old["id"],
                {"family_snapshot": "Forged"},
                edited["revision"],
            )
        self.db.close()
        self.db.open()
        self.assertEqual(self.db.get("bed_plantings", next_crop["id"]), next_crop)
        payload = self.db.export_data()
        self.assertEqual(import_csv(export_csv(payload)), payload)
        plan = self.db.preview_import(payload, "replace")
        self.db.import_data(payload, plan["token"], "replace")
        self.assertEqual(len(self.db.list_records("bed_plantings")), 2)

    def test_self_crossing_degenerate_and_nonfinite_shapes_are_rejected(self) -> None:
        for outline in (
            [[0, 0], [200, 200], [0, 200], [200, 0]],
            [[0, 0], [100, 0], [200, 0]],
            [[0, 0], [300, 0], [float("nan"), 100]],
        ):
            with self.subTest(outline=outline), self.assertRaises(ValidationError):
                self.db.update(
                    "bed_layouts", self.layout["id"], {"outline": outline}, 1
                )

    def test_cutouts_and_concave_u_reject_all_grid_points_outside(self) -> None:
        self.layout = self.db.update(
            "bed_layouts",
            self.layout["id"],
            {"holes": [[[100, 50], [200, 50], [200, 150], [100, 150]]]},
            1,
        )
        with self.assertRaises(ValidationError):
            self.planting(x_cm=90, y_cm=70)
        with self.assertRaises(ValidationError):
            self.planting(x_cm=150, y_cm=100, plant_count=1, columns=1)
        self.planting(x_cm=20, y_cm=20)
        with self.assertRaises(ValidationError):
            self.db.update(
                "bed_layouts",
                self.layout["id"],
                {"outline": [[0, 0], [25, 0], [25, 25], [0, 25]]},
                self.layout["revision"],
            )
        with self.assertRaises(ValidationError):
            self.db.update(
                "bed_layouts",
                self.layout["id"],
                {"holes": [[[0, 0], [100, 0], [100, 100], [0, 100]]]},
                self.layout["revision"],
            )

    def test_invalid_dates_counts_and_reference_changes(self) -> None:
        for fields in (
            {"end_date": "2027-02-01"},
            {"start_date": "2027-02-30"},
            {"plant_count": True},
            {"columns": 0},
            {"spacing_cm": 0},
            {"plant_count": 201},
            {"state": "invented"},
        ):
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                self.planting(**fields)
        other = self.db.create("locations", {"name": "Other"})
        with self.assertRaises(ValidationError):
            self.db.update(
                "bed_layouts", self.layout["id"], {"location_id": other["id"]}, 1
            )
        c = self.db.create(
            "cultivations",
            {
                "plant_id": self.plant["id"],
                "location_id": self.bed["id"],
                "date": "2027-03-01",
                "method": "direct",
            },
        )
        self.planting(cultivation_id=c["id"])
        with self.assertRaises(ConflictError):
            self.db.update(
                "cultivations", c["id"], {"location_id": other["id"]}, c["revision"]
            )

    def test_import_rejects_dangling_placements_and_crossing_shapes(self) -> None:
        self.planting()
        payload = self.db.export_data()
        broken = copy.deepcopy(payload)
        broken["tables"]["bed_plantings"][0]["data"]["x_cm"] = 9999
        with self.assertRaises(ValidationError):
            self.db.preview_import(broken, "replace")
        self.assertEqual(self.db.export_data()["tables"], payload["tables"])

    def test_schema_four_migration_and_rollback_preserve_records(self) -> None:
        self.db.close()
        path = Path(self.temp.name) / "garden_planner.sqlite3"
        with closing(sqlite3.connect(path)) as c, c:
            c.execute("DROP TABLE bed_plantings")
            c.execute("DROP TABLE bed_layouts")
            c.execute("DELETE FROM schema_migrations WHERE version=5")
            c.execute("PRAGMA user_version=4")
        with patch.dict(
            MIGRATIONS, {5: ["CREATE TABLE broken_plan(id)", "INVALID SQL"]}
        ):
            with self.assertRaises(sqlite3.Error):
                self.db.open()
        with closing(sqlite3.connect(path)) as c, c:
            self.assertEqual(c.execute("PRAGMA user_version").fetchone()[0], 4)
            self.assertIsNone(
                c.execute(
                    "SELECT name FROM sqlite_master WHERE name='broken_plan'"
                ).fetchone()
            )
        self.db.open()
        self.assertEqual(self.db.get("plants", self.plant["id"]), self.plant)
        self.assertEqual(self.db.db.execute("PRAGMA user_version").fetchone()[0], 5)
        payload = self.db.export_data()
        old = {
            **payload,
            "schema_version": 4,
            "tables": {
                k: v
                for k, v in payload["tables"].items()
                if k not in {"bed_layouts", "bed_plantings"}
            },
        }
        oldfiles = export_csv(payload)
        oldfiles["metadata.json"] = oldfiles["metadata.json"].replace(
            '"schema_version":5', '"schema_version":4'
        )
        oldfiles.pop("bed_layouts.csv")
        oldfiles.pop("bed_plantings.csv")
        self.assertEqual(len(import_csv(oldfiles)["tables"]), len(TABLES))
        self.db.preview_import(old, "replace")
