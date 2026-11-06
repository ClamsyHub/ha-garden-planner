"""Release channels require explicit selection; tags are never overwritten."""

import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.publish_release import publish


class PublishingTests(unittest.TestCase):
    def test_default_is_preview_and_normal_release_must_be_explicit(self) -> None:
        for channel, flag in (("prerelease", "--prerelease"), ("release", "--latest")):
            with (
                self.subTest(channel=channel),
                patch("scripts.publish_release.validate", return_value=[]),
                patch("scripts.publish_release.subprocess.run") as run,
            ):
                run.side_effect = [
                    subprocess.CompletedProcess([], 1, "", "HTTP 404"),
                    subprocess.CompletedProcess([], 0, "{}", ""),
                    subprocess.CompletedProcess([], 0, "", ""),
                ]
                if channel == "prerelease":
                    publish("v0.1.1", "a" * 40, Path("/tmp/assets"))
                else:
                    publish("v0.1.1", "a" * 40, Path("/tmp/assets"), channel)
                command = run.call_args_list[-1].args[0]
                self.assertIn(flag, command)
                self.assertIn("--verify-tag", command)
                self.assertNotIn(
                    "--latest" if channel == "prerelease" else "--prerelease", command
                )

    def test_invalid_channel_never_calls_github(self) -> None:
        with patch("scripts.publish_release.subprocess.run") as run:
            with self.assertRaises(ValueError):
                publish("v0.1.1", "a" * 40, Path("/tmp/assets"), "automatic")
            run.assert_not_called()

    def test_existing_other_tag_is_not_changed_or_published(self) -> None:
        with (
            patch("scripts.publish_release.validate", return_value=[]),
            patch(
                "scripts.publish_release.subprocess.run",
                return_value=subprocess.CompletedProcess(
                    [], 0, '{"object":{"type":"commit","sha":"different"}}', ""
                ),
            ) as run,
        ):
            with self.assertRaises(ValueError):
                publish("v0.1.1", "a" * 40, Path("/tmp/assets"), "release")
            self.assertEqual(run.call_count, 1)
