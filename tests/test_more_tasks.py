"""Deferral identity and atomic, single-occurrence recurrence."""

import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from custom_components.garden_planner.models import ValidationError
from custom_components.garden_planner.storage.database import Database
from custom_components.garden_planner.task_planning import postpone, reconcile, visible


class MoreTaskTests(unittest.TestCase):
    def test_personal_deferral_survives_reconcile_and_keeps_seasonal_identity(
        self,
    ) -> None:
        plants = [{"id": "p", "data": {"name": "Crop"}}]
        windows = [
            {
                "id": "w",
                "data": {
                    "plant_id": "p",
                    "activity": "care",
                    "start_month": 11,
                    "start_day": 6,
                    "end_month": 11,
                    "end_day": 8,
                },
            }
        ]
        cells = {"p": {"care": True}}
        records = reconcile(
            {}, plants, windows, cells, "owner", date(2026, 11, 6), "de", "now"
        )
        task = visible(records)[0]
        moved = postpone(records, task["id"], task["revision"], "2026-11-20", "later")
        self.assertEqual(moved[task["id"]]["data"]["date"], "2026-11-06")
        refreshed = reconcile(
            moved, plants, windows, cells, "owner", date(2026, 11, 15), "de", "again"
        )
        shown = visible(refreshed)[0]
        self.assertEqual(shown["id"], task["id"])
        self.assertEqual(shown["data"]["date"], "2026-11-20")
        self.assertEqual(shown["data"]["original_date"], "2026-11-06")
        self.assertNotIn("end_date", shown["data"])
        self.assertEqual(len(shown["id"]), len(task["id"]))

    def test_recurring_completion_creates_one_child_and_undo_does_not_duplicate(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            db = Database(Path(temp))
            db.open()
            try:
                task = db.create(
                    "tasks",
                    {
                        "title": "Water",
                        "date": "2026-11-06",
                        "activity": "care",
                        "repeat_every_days": 3,
                        "repeat_until": "2026-11-10",
                    },
                )
                with self.assertRaises(ValidationError):
                    db.update(
                        "tasks",
                        task["id"],
                        {"next_task_id": task["id"]},
                        task["revision"],
                    )
                done = db.update(
                    "tasks", task["id"], {"completed": True}, task["revision"]
                )
                child = db.get("tasks", done["data"]["next_task_id"])
                self.assertEqual(child["data"]["date"], "2026-11-09")
                undone = db.update(
                    "tasks", task["id"], {"completed": False}, done["revision"]
                )
                db.update("tasks", task["id"], {"completed": True}, undone["revision"])
                self.assertEqual(len(db.list_records("tasks")), 2)
                db.update("tasks", child["id"], {"completed": True}, child["revision"])
                self.assertEqual(len(db.list_records("tasks")), 2)
            finally:
                db.close()

    def test_recurrence_and_parent_completion_rollback_together(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            db = Database(Path(temp))
            db.open()
            try:
                task = db.create(
                    "tasks",
                    {
                        "title": "Feed",
                        "date": "2026-11-06",
                        "activity": "fertilize",
                        "repeat_every_days": 14,
                    },
                )
                with (
                    patch.object(
                        db, "_write", side_effect=RuntimeError("write failed")
                    ),
                    self.assertRaises(RuntimeError),
                ):
                    db.update(
                        "tasks", task["id"], {"completed": True}, task["revision"]
                    )
                self.assertEqual(db.get("tasks", task["id"]), task)
                self.assertEqual(len(db.list_records("tasks")), 1)
                with self.assertRaises(ValidationError):
                    db.create(
                        "tasks",
                        {
                            "title": "Bad",
                            "date": "2026-11-06",
                            "activity": "care",
                            "repeat_every_days": 0,
                        },
                    )
            finally:
                db.close()
