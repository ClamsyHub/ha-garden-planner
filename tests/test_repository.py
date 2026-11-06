"""Protect packaging, versioning and private-data boundaries."""

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.check_repository import ROOT, validate


class RepositoryTests(unittest.TestCase):
    """Exercise actual release and repository validation failures."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("custom_components", "hacs.json", "pyproject.toml"):
            source = ROOT / name
            if source.is_dir():
                shutil.copytree(source, self.root / name)
            else:
                shutil.copy2(source, self.root / name)

    def test_valid_foundation(self) -> None:
        self.assertEqual(validate(self.root), [])

    def test_version_mismatch(self) -> None:
        path = self.root / "custom_components/garden_planner/manifest.json"
        manifest = json.loads(path.read_text())
        manifest["version"] = "0.2.0"
        path.write_text(json.dumps(manifest))
        self.assertIn("Manifest and project versions differ.", validate(self.root))

    def test_second_integration_rejected(self) -> None:
        (self.root / "custom_components/unrelated").mkdir()
        self.assertIn("Exactly one integration folder is allowed.", validate(self.root))

    def test_private_database_rejected(self) -> None:
        (self.root / "garden.sqlite3").write_bytes(b"")
        self.assertTrue(any("Private/runtime" in e for e in validate(self.root)))

    def test_release_tag_checked(self) -> None:
        self.assertIn(
            "Release tag does not match manifest version.",
            validate(self.root, tag="v9.0.0"),
        )

    def test_distribution_rejects_the_local_browser_bridge(self) -> None:
        bundle = self.root / "custom_components/garden_planner/www/garden-planner.js"
        bundle.parent.mkdir(exist_ok=True)
        bundle.write_text("fetch('/__test_api/session')")
        self.assertIn(
            "Development transport found in runtime bundle.", validate(self.root)
        )

    def test_incomplete_release_is_blocked(self) -> None:
        (self.root / "custom_components/garden_planner/brand/icon.png").unlink()
        errors = validate(self.root, release=True, tag="v0.1.0")
        self.assertIn("Original brand/icon.png is missing.", errors)
        self.assertIn("Release notes are missing.", errors)


if __name__ == "__main__":
    unittest.main()
