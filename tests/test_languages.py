"""Language completeness and localized task/event captions stay in sync."""

import json
import re
import unittest
from datetime import date
from pathlib import Path
from typing import Any

from custom_components.garden_planner.language_data import (
    ACTIVITY_LABELS,
    EVENT_LABELS,
    SUPPORTED_LANGUAGES,
    activity_label,
    event_label,
)
from custom_components.garden_planner.options import validate_options
from custom_components.garden_planner.task_planning import reconcile


class LanguageTests(unittest.TestCase):
    def test_every_language_is_valid_and_has_all_runtime_captions(self) -> None:
        self.assertEqual(len(SUPPORTED_LANGUAGES), 24)
        for language in SUPPORTED_LANGUAGES:
            with self.subTest(language=language):
                self.assertEqual(
                    validate_options({"language": language})["language"], language
                )
                self.assertEqual(
                    set(ACTIVITY_LABELS[language]), set(ACTIVITY_LABELS["en"])
                )
                self.assertEqual(set(EVENT_LABELS[language]), set(EVENT_LABELS["en"]))
                self.assertTrue(all(ACTIVITY_LABELS[language].values()))
                self.assertTrue(all(EVENT_LABELS[language].values()))
        self.assertEqual(activity_label("fr", "prune"), "Taille")
        self.assertEqual(activity_label("xx", "direct"), "Direct sowing")
        self.assertEqual(event_label("xx", "unknown"), "unknown")

    def test_home_assistant_translation_keys_match(self) -> None:
        folder = (
            Path(__file__).resolve().parents[1]
            / "custom_components/garden_planner/translations"
        )

        def flatten(value: dict[str, object], prefix: str = "") -> dict[str, str]:
            result: dict[str, str] = {}
            for key, item in value.items():
                path = prefix + "." + key
                if isinstance(item, dict):
                    result.update(flatten(item, path))
                else:
                    self.assertIsInstance(item, str)
                    result[path] = str(item)
            return result

        reference = flatten(json.loads((folder / "en.json").read_text()))
        for language in SUPPORTED_LANGUAGES:
            values = flatten(json.loads((folder / f"{language}.json").read_text()))
            self.assertEqual(set(values), set(reference), language)
            self.assertTrue(all(value.strip() for value in values.values()), language)
            self.assertFalse(
                any(
                    re.search(r"GP[A-Z]*\d{3}X|ZXQ", value) for value in values.values()
                ),
                language,
            )

    def test_generated_tasks_use_the_chosen_language_and_keep_user_text(self) -> None:
        plants: list[dict[str, Any]] = [
            {"id": "p", "data": {"name": "Synthetic plant"}}
        ]
        windows: list[dict[str, Any]] = [
            {
                "id": "w",
                "data": {
                    "plant_id": "p",
                    "activity": "prune",
                    "start_month": 1,
                    "start_day": 15,
                    "end_month": 2,
                    "end_day": 28,
                    "notes": "User-entered observation",
                },
            }
        ]
        for language in SUPPORTED_LANGUAGES:
            records = reconcile(
                {},
                plants,
                windows,
                {"p": {"prune": True}},
                "test-user",
                date(2027, 1, 15),
                language,
                "2027-01-15T12:00:00+00:00",
            )
            self.assertTrue(records, language)
            for record in records.values():
                self.assertEqual(
                    record["data"]["title"],
                    "Synthetic plant: " + ACTIVITY_LABELS[language]["prune"],
                )
                self.assertEqual(record["data"]["notes"], "User-entered observation")
                self.assertTrue(record["data"]["end_date"].endswith("02-28"))
