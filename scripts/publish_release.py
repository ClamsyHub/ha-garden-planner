"""Publish through gh after the workflow's checks and protected environment gate."""

import argparse
import json
import re
import subprocess
from pathlib import Path

from scripts.check_repository import ROOT, validate


def publish(tag: str, commit: str, assets: Path, channel: str = "prerelease") -> None:
    """Never overwrite a tag/release or publish an untested target commit."""
    if channel not in {"prerelease", "release"}:
        raise ValueError("Choose an explicit release channel.")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("An exact tested commit is required.")
    errors = validate(ROOT, release=True, tag=tag)
    if errors:
        raise ValueError("; ".join(errors))
    result = subprocess.run(
        ["gh", "api", f"repos/{{owner}}/{{repo}}/git/ref/tags/{tag}"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        obj = json.loads(result.stdout)["object"]
        if obj.get("type") != "commit" or obj.get("sha") != commit:
            raise ValueError(
                "Existing tag does not point directly at the tested commit."
            )
    elif "HTTP 404" in result.stderr:
        subprocess.run(
            [
                "gh",
                "api",
                "repos/{owner}/{repo}/git/refs",
                "-X",
                "POST",
                "-f",
                f"ref=refs/tags/{tag}",
                "-f",
                f"sha={commit}",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    else:
        raise RuntimeError("Unable to check the candidate tag; publication stopped.")
    subprocess.run(
        [
            "gh",
            "release",
            "create",
            tag,
            str(assets / "garden_planner.zip"),
            str(assets / "SHA256SUMS"),
            "--verify-tag",
            "--prerelease" if channel == "prerelease" else "--latest",
            "--title",
            f"Garden Planner {tag}"
            + (" — development preview" if channel == "prerelease" else ""),
            "--notes-file",
            str(ROOT / "docs/releases" / f"{tag}.md"),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument(
        "--channel", choices=("prerelease", "release"), default="prerelease"
    )
    args = parser.parse_args()
    publish(args.tag, args.commit, args.assets, args.channel)


if __name__ == "__main__":
    main()
