"""Build a deterministic HACS integration ZIP, with no source-tree/runtime extras."""

import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from scripts.check_repository import DOMAIN, ROOT, validate

ALLOWED = {".py", ".json", ".js", ".txt", ".png", ".md"}


def build(root: Path, output: Path, tag: str) -> None:
    """Package only the reviewed runtime subtree and MIT license."""
    errors = validate(root, release=True, tag=tag)
    if errors:
        raise ValueError("; ".join(errors))
    component = root / "custom_components" / DOMAIN
    files = {}
    for path in sorted(component.rglob("*")):
        if "__pycache__" in path.parts or path.suffix in {".pyc", ".pyo"}:
            continue
        if path.is_symlink():
            raise ValueError("Release files must not be symlinks.")
        if not path.is_file():
            continue
        if path.suffix not in ALLOWED:
            raise ValueError(f"Unexpected runtime file: {path.name}")
        files[path.relative_to(component).as_posix()] = path.read_bytes()
    files["LICENSE"] = (root / "LICENSE").read_bytes()
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compresslevel=9)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--tag", required=True)
    args = parser.parse_args()
    build(ROOT, args.output, args.tag)
    print("Built integration ZIP:", args.output.name)


if __name__ == "__main__":
    main()
