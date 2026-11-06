"""Default privacy, malformed options and persistent notification reservations."""

import tempfile
import unittest
from pathlib import Path
from typing import Any

from custom_components.garden_planner.models import ValidationError
from custom_components.garden_planner.options import validate_options
from custom_components.garden_planner.storage import Database


class OptionTests(unittest.TestCase):
    def test_default_requires_explicit_opt_in_and_channel(self) -> None:
        self.assertFalse(validate_options({})["reminders_enabled"])
        for value in (
            {"reminders_enabled": True},
            {"reminders_enabled": "true"},
            {"notify_service": "notify.send_message"},
            {"notify_service": "shell_command.execute"},
        ):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_options(value)

    def test_untrusted_settings_fail_closed(self) -> None:
        invalid: list[Any] = [
            None,
            [],
            {"unknown": True},
            {"lead_days": True},
            {"lead_days": 31},
            {"reminder_hour": -1},
            {"language": "fr"},
            {"writers": "admin"},
            {"writers": ["../admin"]},
            {"notify_entity": "sensor.temperature"},
        ]
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_options(value)

    def test_new_entity_notification_target(self) -> None:
        result = validate_options(
            {
                "reminders_enabled": True,
                "notify_service": "notify.send_message",
                "notify_entity": "notify.test_channel",
                "lead_days": 0,
                "reminder_hour": 23,
                "language": "en",
            }
        )
        self.assertTrue(result["reminders_enabled"])
        self.assertEqual(result["lead_days"], 0)

    def test_import_and_restart_never_rewind_delivery_reservations(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            db = Database(Path(folder))
            db.open()
            try:
                empty = db.export_data()
                self.assertTrue(db.claim_reminder("task:test:2026-11-06", "Test"))
                db.finish_reminder("task:test:2026-11-06", "uncertain")
                self.assertFalse(db.claim_reminder("task:test:2026-11-06", "Test"))
                self.assertNotIn("settings", empty["tables"])
                preview = db.preview_import(empty, "replace")
                db.import_data(empty, preview["token"], "replace")
                db.close()
                db.open()
                self.assertFalse(db.claim_reminder("task:test:2026-11-06", "Test"))
                self.assertEqual(db.reminder_log()[0]["state"], "uncertain")
            finally:
                db.close()
