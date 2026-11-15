"""New activity generations, defaults and opt-out preservation."""

import unittest
from typing import Any, cast

from custom_components.garden_planner.models import ValidationError
from custom_components.garden_planner.reminder_preferences import (
    availability,
    selections,
    updated,
)


class PreferenceTests(unittest.TestCase):
    def test_defaults_and_new_window_generation(self) -> None:
        available = {"plant": {"direct": ["first", "second"]}}
        self.assertTrue(selections(available, {})["plant"]["direct"])
        stored = updated(available, {}, "plant", "direct", False)
        self.assertFalse(selections(available, stored)["plant"]["direct"])
        self.assertFalse(
            selections({"plant": {"direct": ["second", "third"]}}, stored)["plant"][
                "direct"
            ]
        )
        self.assertTrue(
            selections({"plant": {"direct": ["new"]}}, stored)["plant"]["direct"]
        )
        self.assertTrue(
            selections({"plant": {"care": ["care"]}}, stored)["plant"]["care"]
        )
        self.assertNotIn("care", selections(available, stored)["plant"])
        self.assertEqual(selections({}, stored), {})
        self.assertTrue(
            selections(available, updated(available, stored, "plant", "direct", True))[
                "plant"
            ]["direct"]
        )

    def test_missing_and_invalid_cells_cannot_be_saved(self) -> None:
        for enabled in (False, True):
            with self.assertRaises(ValidationError):
                updated({}, {}, "plant", "care", enabled)
        with self.assertRaises(ValidationError):
            updated(
                {"plant": {"care": ["id"]}}, {}, "plant", "care", cast(Any, "false")
            )
        self.assertEqual(
            availability(
                [{"id": "plant", "data": {"archived": True}}],
                [{"id": "w", "data": {"plant_id": "plant", "activity": "care"}}],
            ),
            {},
        )
