"""Annual generation, completion history, cancellation and optimistic locking."""

import unittest
from copy import deepcopy
from datetime import date
from typing import Any, cast
from unittest.mock import patch

from custom_components.garden_planner.models import (
    ConflictError,
    NotFoundError,
    StorageError,
    ValidationError,
)
from custom_components.garden_planner.task_planning import complete, reconcile, visible


class TaskPlanningTests(unittest.TestCase):
    def setUp(self) -> None:
        self.plants: list[dict[str, Any]] = [
            {"id": "p", "data": {"name": "Synthetic crop"}}
        ]
        self.windows: list[dict[str, Any]] = [
            {
                "id": "w",
                "data": {
                    "plant_id": "p",
                    "activity": "care",
                    "start_month": 11,
                    "start_day": 16,
                    "notes": "Check the bed",
                },
            }
        ]
        self.cells = {"p": {"care": True}}
        self.today = date(2026, 11, 16)

    def plan(
        self, records: dict[str, Any] | None = None, **kwargs: Any
    ) -> dict[str, Any]:
        values: dict[str, Any] = {
            "existing": records or {},
            "plants": self.plants,
            "windows": self.windows,
            "cells": self.cells,
            "user_id": "one",
            "today": self.today,
            "language": "de",
            "stamp": "2026-11-16T12:00:00+00:00",
        }
        values.update(kwargs)
        return reconcile(**values)

    def test_stable_ids_dates_and_separate_owners(self) -> None:
        first = self.plan()
        self.assertEqual(len(first), 2)
        self.assertEqual(
            {r["data"]["date"] for r in first.values()}, {"2026-11-16", "2027-11-16"}
        )
        self.assertEqual(self.plan(first), first)
        self.assertTrue(set(first).isdisjoint(self.plan(user_id="two")))
        self.assertTrue(all(r["data"]["personal_generated"] for r in first.values()))

    def test_completed_history_survives_refresh_disable_and_next_year(self) -> None:
        records = self.plan()
        task = next(r for r in visible(records) if r["data"]["date"] == "2026-11-16")
        records = complete(records, task["id"], task["revision"], True, "done")
        self.assertEqual(self.plan(records), records)
        cancelled = self.plan(records, cells={"p": {"care": False}})
        self.assertEqual(len(visible(cancelled)), 1)
        self.assertTrue(visible(cancelled)[0]["data"]["completed"])
        restored = self.plan(cancelled)
        self.assertTrue(restored[task["id"]]["data"]["completed"])
        future = self.plan(restored, today=date(2027, 11, 16))
        self.assertTrue(future[task["id"]]["data"]["completed"])
        self.assertFalse(
            next(r for r in visible(future) if r["data"]["date"] == "2027-11-16")[
                "data"
            ]["completed"]
        )

    def test_cancel_and_reenable_keep_ids_and_increment_revision(self) -> None:
        first = self.plan()
        cancelled = self.plan(first, cells={})
        self.assertEqual(visible(cancelled), [])
        restored = self.plan(cancelled)
        self.assertEqual(set(restored), set(first))
        self.assertTrue(
            all(restored[k]["revision"] > first[k]["revision"] for k in first)
        )
        with self.assertRaises(NotFoundError):
            complete(cancelled, next(iter(cancelled)), 1, True, "now")

    def test_source_edits_cancel_old_dates_and_keep_overdue_work(self) -> None:
        first = self.plan()
        later = self.plan(first, today=date(2026, 12, 1))
        self.assertTrue(any(r["data"]["date"] == "2026-11-16" for r in visible(later)))
        windows = deepcopy(self.windows)
        windows[0]["data"]["start_day"] = 17
        changed = self.plan(first, windows=windows)
        self.assertTrue(
            all(r["data"]["date"].endswith("11-17") for r in visible(changed))
        )
        self.assertEqual(visible(self.plan(first, windows=[])), [])
        archived = deepcopy(self.plants)
        archived[0]["data"]["archived"] = True
        self.assertEqual(visible(self.plan(first, plants=archived)), [])

    def test_leap_year_and_year_boundary(self) -> None:
        windows = deepcopy(self.windows)
        windows[0]["data"].update(start_month=2, start_day=29)
        rows = visible(self.plan(windows=windows, today=date(2027, 2, 28)))
        self.assertEqual([r["data"]["date"] for r in rows], ["2028-02-29"])
        windows[0]["data"].update(start_month=12, start_day=31)
        rows = visible(self.plan(windows=windows, today=date(2027, 1, 1)))
        self.assertIn("2026-12-31", [r["data"]["date"] for r in rows])

    def test_revision_validation_and_no_mutation_on_failure(self) -> None:
        records = self.plan()
        before = deepcopy(records)
        key = next(iter(records))
        with self.assertRaises(ConflictError):
            complete(records, key, 99, True, "now")
        with self.assertRaises(ValidationError):
            complete(records, key, 1, cast(Any, "true"), "now")
        self.assertEqual(records, before)
        shown = visible(records)
        shown[0]["data"]["completed"] = True
        self.assertEqual(records, before)
        with patch("custom_components.garden_planner.task_planning.MAX_RECORDS", 1):
            with self.assertRaises(StorageError):
                self.plan()
