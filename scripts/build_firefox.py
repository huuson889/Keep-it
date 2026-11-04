#!/usr/bin/env python3
"""Create a Firefox-ready extension folder without Chromium-only manifest keys."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRS = {
    ".git", ".arena", ".cache", ".local", ".mypy_cache", ".next", ".nox",
    ".npm", ".nuxt", ".output", ".parcel-cache", ".playwright-cli",
    ".pytest_cache", ".ruff_cache", ".svelte-kit", ".tox", ".turbo",
    ".venv", ".vite", "__pycache__", "build", "coverage", "dist",
    "node_modules", "out", "target",
}
IGNORED_FILES = {"sync-watch.ps1", "sync-state.txt", "sync-watch.log"}


def ignore_generated(path: str, names: list[str]) -> set[str]:
    ignored = {name for name in names if name in IGNORED_DIRS or name in IGNORED_FILES}
    ignored.update(name for name in names if name.lower().endswith(".zip"))
    return ignored


def build_firefox(output: Path) -> Path:
    output = output.expanduser().resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("Choose an output folder outside the source repository.")
    if output.exists():
        raise FileExistsError(f"Output folder already exists: {output}")

    shutil.copytree(ROOT, output, ignore=ignore_generated)
    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # These Chromium-only fields produce Firefox manifest warnings; Firefox uses
    # sidebar_action instead. MV3 Firefox background scripts use scripts, not service_worker.
    manifest["permissions"] = [p for p in manifest.get("permissions", []) if p != "sidePanel"]
    manifest.pop("side_panel", None)
    background = manifest.get("background", {})
    background.pop("service_worker", None)
    manifest.setdefault("sidebar_action", {})["open_at_install"] = False

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output


def main() -> None:
    source_manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    version = source_manifest.get("version", "unknown")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT.parent / f"Keepit-Firefox-v{version}",
        help="Output folder (must be outside the source repository).",
    )
    args = parser.parse_args()
    output = build_firefox(args.output)
    print(f"Firefox extension build ready: {output}")
    print(f"Load {output / 'manifest.json'} from about:debugging#/runtime/this-firefox")


if __name__ == "__main__":
    main()
