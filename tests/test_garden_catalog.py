"""Shared seed planning, reciprocal neighbors and lossless legacy exchange."""

import csv
import io
import sqlite3
import tempfile
import unittest
from pathlib import Path
from typing import Any
from unittest.mock import patch

from custom_components.garden_planner.exchange import export_csv, import_csv
from custom_components.garden_planner.models import (
    GARDEN_FIELDS,
    ConflictError,
    ValidationError,
)
from custom_components.garden_planner.storage.database import Database


class GardenCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.directory = Path(temp.name)
        self.db = Database(self.directory)
        self.db.open()
        self.addCleanup(self.db.close)
        self.a = self.db.create("plants", {"name": "Buschbohne"})
        self.b = self.db.create("plants", {"name": "Erdbeere"})
        self.c = self.db.create("plants", {"name": "Tomate"})

    def groups(
        self, good: list[str] | None = None, bad: list[str] | None = None
    ) -> dict[str, Any]:
        return {
            "neighbor_good_ids": good or [],
            "neighbor_bad_ids": bad or [],
            "neighbor_good_names": [],
            "neighbor_bad_names": ["Fenchel"],
        }

    def test_reciprocal_switch_remove_conflict_and_deletion(self) -> None:
        linked = self.db.set_neighbors(self.a["id"], 1, self.groups([self.b["id"]]))
        other = self.db.get("plants", self.b["id"])
        self.assertEqual(other["data"]["neighbor_good_ids"], [self.a["id"]])
        before = self.db.export_data()["tables"]
        with self.assertRaises(ConflictError):
            self.db.set_neighbors(self.b["id"], 1, self.groups())
        self.assertEqual(before, self.db.export_data()["tables"])
        with self.assertRaises(ConflictError):
            self.db.delete("plants", self.b["id"], other["revision"], confirm=True)
        switched = self.db.set_neighbors(
            self.a["id"], linked["revision"], self.groups(bad=[self.b["id"]])
        )
        other = self.db.get("plants", self.b["id"])
        self.assertEqual(other["data"]["neighbor_good_ids"], [])
        self.assertEqual(other["data"]["neighbor_bad_ids"], [self.a["id"]])
        self.db.set_neighbors(self.a["id"], switched["revision"], self.groups())
        other = self.db.get("plants", self.b["id"])
        self.db.delete("plants", other["id"], other["revision"], confirm=True)

    def test_multiple_neighbors_preserve_unrelated_pairs_and_rollback_on_failure(
        self,
    ) -> None:
        self.db.set_neighbors(self.b["id"], 1, self.groups([self.c["id"]]))
        self.db.set_neighbors(
            self.a["id"], 1, self.groups([self.b["id"], self.c["id"]])
        )
        other = self.db.get("plants", self.b["id"])
        self.assertEqual(
            set(other["data"]["neighbor_good_ids"]), {self.a["id"], self.c["id"]}
        )
        before = self.db.export_data()["tables"]
        original = self.db._write

        def fail_source(
            table: str, record: dict[str, Any], data: dict[str, Any]
        ) -> None:
            if record["id"] == self.a["id"]:
                raise sqlite3.OperationalError("Synthetic storage failure")
            original(table, record, data)

        current = self.db.get("plants", self.a["id"])
        with (
            patch.object(self.db, "_write", side_effect=fail_source),
            self.assertRaises(sqlite3.OperationalError),
        ):
            self.db.set_neighbors(
                self.a["id"], current["revision"], self.groups(bad=[self.b["id"]])
            )
        self.assertEqual(before, self.db.export_data()["tables"])
        self.db.set_neighbors(
            self.a["id"], current["revision"], self.groups([self.c["id"]])
        )
        self.assertEqual(
            self.db.get("plants", self.b["id"])["data"]["neighbor_good_ids"],
            [self.c["id"]],
        )

    def test_invalid_neighbor_groups_do_not_write(self) -> None:
        invalid = [
            self.groups([self.a["id"]]),
            self.groups(["missing"]),
            self.groups([self.b["id"]], [self.b["id"]]),
            self.groups([self.b["id"], self.b["id"]]),
            {**self.groups(), "neighbor_good_names": ["fenchel"]},
            {**self.groups(), "neighbor_good_names": [" "]},
            {**self.groups(), "neighbor_good_names": [" buschbohne "]},
        ]
        before = self.db.export_data()["tables"]
        for groups in invalid:
            with self.subTest(groups=groups), self.assertRaises(ValidationError):
                self.db.set_neighbors(self.a["id"], 1, groups)
            self.assertEqual(before, self.db.export_data()["tables"])
        with self.assertRaises(ValidationError):
            self.db.update(
                "plants", self.a["id"], {"neighbor_good_ids": [self.b["id"]]}, 1
            )
        with self.assertRaises(ValidationError):
            self.db.create(
                "plants", {"name": "Unlinked", "neighbor_good_ids": [self.a["id"]]}
            )

    def test_seed_batch_is_atomic_and_snapshot_copy_is_clean(self) -> None:
        self.db.update("plants", self.b["id"], {"notes": "Concurrent edit"}, 1)
        with self.assertRaises(ConflictError):
            self.db.set_seed_inventory(
                [
                    {"id": self.a["id"], "revision": 1, "state": "available"},
                    {"id": self.b["id"], "revision": 1, "state": "buy"},
                ]
            )
        self.assertNotIn("seed_state", self.db.get("plants", self.a["id"])["data"])
        self.db.set_seed_inventory(
            [{"id": self.a["id"], "revision": 1, "state": "available"}]
        )
        plant = self.db.get("plants", self.a["id"])
        self.db.set_neighbors(
            plant["id"], plant["revision"], self.groups([self.c["id"]])
        )
        clone = self.db.duplicate_plant(plant["id"], "Another plant")
        self.assertFalse(GARDEN_FIELDS & clone["data"].keys())
        culture = self.db.create(
            "cultivations",
            {"plant_id": plant["id"], "date": "2026-11-17", "method": "direct"},
        )
        self.assertFalse(GARDEN_FIELDS & culture["data"]["snapshot"]["plant"].keys())
        for state in ("available", "buy", "unneeded", "unplanned"):
            current = self.db.get("plants", self.c["id"])
            rows = self.db.set_seed_inventory(
                [{"id": current["id"], "revision": current["revision"], "state": state}]
            )
            self.assertEqual(rows[0]["data"]["seed_state"], state)
        with self.assertRaises(ValidationError):
            self.db.set_seed_inventory(
                [
                    {
                        "id": current["id"],
                        "revision": rows[0]["revision"],
                        "state": "unknown",
                    }
                ]
            )

    def test_restart_exports_backups_and_legacy_csv(self) -> None:
        self.db.set_neighbors(self.a["id"], 1, self.groups([self.b["id"]]))
        current = self.db.get("plants", self.a["id"])
        self.db.set_seed_inventory(
            [{"id": current["id"], "revision": current["revision"], "state": "buy"}]
        )
        expected = self.db.export_data()["tables"]
        backup = self.db.backup()
        self.db.close()
        self.db.open()
        self.assertEqual(expected, self.db.export_data()["tables"])
        payload = import_csv(export_csv(self.db.export_data()))
        other = Database(self.directory / "roundtrip")
        other.open()
        self.addCleanup(other.close)
        plan = other.preview_import(payload)
        other.import_data(payload, plan["token"])
        self.assertEqual(expected, other.export_data()["tables"])
        self.assertEqual(expected, self.db.read_backup(backup)["tables"])
        current = self.db.get("plants", self.a["id"])
        self.db.set_seed_inventory(
            [
                {
                    "id": current["id"],
                    "revision": current["revision"],
                    "state": "available",
                }
            ]
        )
        restore = self.db.preview_restore(backup)
        self.db.restore(backup, restore["token"])
        self.assertEqual(
            {p["id"]: p["data"] for p in expected["plants"]},
            {p["id"]: p["data"] for p in self.db.export_data()["tables"]["plants"]},
        )
        broken = self.db.export_data()
        broken["tables"]["plants"] = [
            dict(
                p, data={k: v for k, v in p["data"].items() if k != "neighbor_good_ids"}
            )
            if p["id"] == self.b["id"]
            else p
            for p in broken["tables"]["plants"]
        ]
        with self.assertRaises(ValidationError):
            other.preview_import(broken, "replace")
        files = export_csv(self.db.export_data())
        rows = list(csv.reader(io.StringIO(files["plants.csv"])))
        keep = [i for i, key in enumerate(rows[0]) if key not in GARDEN_FIELDS]
        output = io.StringIO(newline="")
        writer = csv.writer(output)
        writer.writerows([[row[i] for i in keep] for row in rows])
        files["plants.csv"] = output.getvalue()
        legacy = import_csv(files)
        self.assertTrue(
            all(
                not (GARDEN_FIELDS & p["data"].keys())
                for p in legacy["tables"]["plants"]
            )
        )
        other.preview_import(legacy, "replace")
