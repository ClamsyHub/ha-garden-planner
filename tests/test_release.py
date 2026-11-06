"""Verify the artifact HACS actually installs, rather than the whole source ZIP."""

import hashlib
import shutil
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from scripts.build_release import build
from scripts.check_repository import ROOT


class ReleaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "source"
        self.root.mkdir()
        for name in (
            "custom_components",
            "docs/releases",
            "LICENSE",
            "hacs.json",
            "pyproject.toml",
        ):
            source = ROOT / name
            destination = self.root / name
            if source.is_dir():
                shutil.copytree(
                    source, destination, ignore=shutil.ignore_patterns("__pycache__")
                )
            else:
                shutil.copy2(source, destination)

    def test_artifact_is_reproducible_and_complete(self) -> None:
        one, two = Path(self.temp.name) / "one.zip", Path(self.temp.name) / "two.zip"
        build(self.root, one, "v0.1.0")
        build(self.root, two, "v0.1.0")
        self.assertEqual(
            hashlib.sha256(one.read_bytes()).digest(),
            hashlib.sha256(two.read_bytes()).digest(),
        )
        with ZipFile(one) as archive:
            names = set(archive.namelist())
            self.assertTrue(
                {
                    "manifest.json",
                    "__init__.py",
                    "LICENSE",
                    "www/garden-planner.js",
                    "www/THIRD_PARTY_NOTICES.txt",
                    "brand/icon.png",
                    "translations/de.json",
                }
                <= names
            )
            self.assertFalse(
                any(
                    name.startswith(("/", "custom_components/", "../"))
                    for name in names
                )
            )
            self.assertIsNone(archive.testzip())

    def test_private_database_never_enters_an_artifact(self) -> None:
        (self.root / "custom_components/garden_planner/private.sqlite3").touch()
        with self.assertRaises(ValueError):
            build(self.root, Path(self.temp.name) / "blocked.zip", "v0.1.0")

    def test_tag_version_and_notes_are_required(self) -> None:
        with self.assertRaises(ValueError):
            build(self.root, Path(self.temp.name) / "blocked.zip", "v9.0.0")
