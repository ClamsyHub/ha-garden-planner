"""Validate distribution boundaries without importing Home Assistant."""

import argparse
import ast
import json
import re
import struct
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "garden_planner"


def validate(root: Path, *, release: bool = False, tag: str | None = None) -> list[str]:
    """Return actionable errors; never change repository or runtime files."""
    errors: list[str] = []
    component = root / "custom_components" / DOMAIN
    manifest = json.loads((component / "manifest.json").read_text())
    hacs = json.loads((root / "hacs.json").read_text())
    project = tomllib.loads((root / "pyproject.toml").read_text())["project"]
    folders = sorted(p.name for p in component.parent.iterdir() if p.is_dir())
    if folders != [DOMAIN]:
        errors.append("Exactly one integration folder is allowed.")
    if manifest.get("domain") != DOMAIN:
        errors.append("Manifest domain must match the folder name.")
    for key in ("name", "version", "codeowners", "documentation", "issue_tracker"):
        if not manifest.get(key):
            errors.append(f"Missing manifest value: {key}")
    version = manifest.get("version", "")
    if not re.fullmatch(r"0|[1-9]\d*", version.split(".")[0]):
        errors.append("Invalid major version.")
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version):
        errors.append("Expected stable semantic version MAJOR.MINOR.PATCH.")
    if version != project.get("version"):
        errors.append("Manifest and project versions differ.")
    if hacs.get("name") != manifest.get("name"):
        errors.append("HACS and manifest names differ.")
    if hacs.get("homeassistant") != "2026.7.0":
        errors.append("Review the documented HA compatibility floor.")
    for p in root.rglob("*"):
        if not p.is_file() or any(
            part
            in {
                ".git",
                ".venv",
                "node_modules",
                "__pycache__",
                ".mypy_cache",
                ".ruff_cache",
            }
            for part in p.relative_to(root).parts
        ):
            continue
        if p.suffix in {".sqlite", ".sqlite3", ".db", ".pem", ".key"} or p.name in {
            "secrets.yaml",
            "configuration.yaml",
            ".env",
        }:
            errors.append(f"Private/runtime file in source tree: {p.relative_to(root)}")
        if p.suffix == ".json":
            json.loads(p.read_text())
        if p.suffix == ".py":
            ast.parse(p.read_text(), filename=str(p))
    bundle = component / "www/garden-planner.js"
    if bundle.exists() and any(
        marker in bundle.read_text()
        for marker in (
            "__test_api",
            "test-admin",
            "gardenPlannerTestHost",
        )
    ):
        errors.append("Development transport found in runtime bundle.")
    frontend_package = root / "frontend/package.json"
    if frontend_package.exists():
        frontend = json.loads(frontend_package.read_text())
        if frontend.get("version") != version:
            errors.append("Frontend and manifest versions differ.")
    translations = component / "translations"
    en = json.loads((translations / "en.json").read_text())
    de = json.loads((translations / "de.json").read_text())
    if set(en) != set(de):
        errors.append("English and German translation sections differ.")
    if tag is not None and tag.removeprefix("v") != version:
        errors.append("Release tag does not match manifest version.")
    if release:
        if (
            not manifest.get("config_flow")
            or not (component / "config_flow.py").is_file()
        ):
            errors.append("Config flow is not implemented.")
        if not (component / "brand/icon.png").is_file():
            errors.append("Original brand/icon.png is missing.")
        if not (component / "www/garden-planner.js").is_file():
            errors.append("Compiled frontend is missing.")
        if not en or not de:
            errors.append("Runtime translations are not implemented.")
        for name, size in (("icon.png", 256), ("icon@2x.png", 512)):
            image = component / "brand" / name
            if image.is_file():
                data = image.read_bytes()
                if (
                    len(data) < 24
                    or data[:8] != b"\x89PNG\r\n\x1a\n"
                    or struct.unpack(">II", data[16:24]) != (size, size)
                ):
                    errors.append(f"Invalid brand image: {name}")
            else:
                errors.append(f"Brand asset missing: {name}")
        if (
            hacs.get("zip_release") is not True
            or hacs.get("filename") != "garden_planner.zip"
        ):
            errors.append("Release ZIP configuration is incomplete.")
        if tag and not (root / "docs" / "releases" / f"{tag}.md").is_file():
            errors.append("Release notes are missing.")

    return errors


def main() -> int:
    """Run repository or release validation."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", action="store_true")
    parser.add_argument("--tag")
    args = parser.parse_args()
    errors = validate(ROOT, release=args.release, tag=args.tag)
    for error in errors:
        print(f"ERROR: {error}")
    if not errors:
        print("Repository structure and metadata validated.")
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
