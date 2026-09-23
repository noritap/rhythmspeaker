#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_FILES = [
    Path("broadcast/index.html"),
    Path("broadcast/styles.css"),
    Path("broadcast/app.js"),
    Path("broadcast/data/programs.json"),
    Path("broadcast/data/episodes.json"),
    Path("broadcast/data/people.json"),
]


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def audit(root: Path) -> list[str]:
    problems: list[str] = []

    for rel in REQUIRED_FILES:
        if not (root / rel).exists():
            problems.append(f"FILE_MISSING:{rel}")

    if problems:
        return problems

    try:
        programs = load_json(root / "broadcast/data/programs.json")
        episodes = load_json(root / "broadcast/data/episodes.json")
        people = load_json(root / "broadcast/data/people.json")
    except (json.JSONDecodeError, OSError) as exc:
        return [f"JSON_LOAD_ERROR:{exc}"]

    program_ids = {item.get("id") for item in programs if item.get("id")}
    episode_ids = {item.get("id") for item in episodes if item.get("id")}
    people_ids = {item.get("id") for item in people if item.get("id")}

    if len(program_ids) != len(programs):
        problems.append("PROGRAM_ID_MISSING_OR_DUPLICATE")
    if len(episode_ids) != len(episodes):
        problems.append("EPISODE_ID_MISSING_OR_DUPLICATE")
    if len(people_ids) != len(people):
        problems.append("PERSON_ID_MISSING_OR_DUPLICATE")

    episodes_by_id = {item.get("id"): item for item in episodes if item.get("id")}

    for program in programs:
        program_id = program.get("id")
        if not program_id:
            continue
        page = root / f"broadcast/programs/{program_id}/index.html"
        if not page.exists():
            problems.append(f"PROGRAM_PAGE_MISSING:{program_id}")

        for person_id in [*(program.get("host_ids") or []), *(program.get("assistant_ids") or [])]:
            if person_id not in people_ids:
                problems.append(f"PROGRAM_PERSON_UNKNOWN:{program_id}:{person_id}")

    for episode in episodes:
        episode_id = episode.get("id")
        if not episode_id:
            continue

        program_id = episode.get("program")
        if program_id not in program_ids:
            problems.append(f"EPISODE_PROGRAM_UNKNOWN:{episode_id}:{program_id}")

        page = root / f"broadcast/episodes/{episode_id}/index.html"
        if not page.exists():
            problems.append(f"EPISODE_PAGE_MISSING:{episode_id}")

        youtube_id = episode.get("youtube_id")
        youtube_url = episode.get("youtube_url") or ""
        if youtube_id and youtube_id not in youtube_url:
            problems.append(f"YOUTUBE_ID_URL_MISMATCH:{episode_id}")

        for person_id in episode.get("guest_ids") or []:
            if person_id not in people_ids:
                problems.append(f"EPISODE_GUEST_UNKNOWN:{episode_id}:{person_id}")

    ecosystem = root / "ecosystem/index.html"
    if ecosystem.exists() and "../broadcast/" not in ecosystem.read_text(encoding="utf-8"):
        problems.append("ECOSYSTEM_WATCH_ROUTE_MISSING")

    network_page = root / "broadcast/index.html"
    if network_page.exists():
        text = network_page.read_text(encoding="utf-8")
        for hook in [
            'data-rsb-network-featured',
            'data-rsb-network-latest',
            'data-rsb-network-programs',
            'data-rsb-network-people',
        ]:
            if hook not in text:
                problems.append(f"NETWORK_DATA_HOOK_MISSING:{hook}")

    program_page = root / "broadcast/programs/ayako-no-heya/index.html"
    if program_page.exists():
        text = program_page.read_text(encoding="utf-8")
        if 'data-rsb-episode-archive="ayako-no-heya"' not in text:
            problems.append("AYAKO_DATA_ARCHIVE_HOOK_MISSING")
        if 'data-rsb-people="ayako-no-heya"' not in text:
            problems.append("AYAKO_PEOPLE_HOOK_MISSING")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit RS BROADCAST NETWORK static data and routes")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    problems = audit(args.root)
    if not problems:
        print("BROADCAST AUDIT: PASS")
        return 0

    print("BROADCAST AUDIT: FAIL")
    for problem in problems:
        print(f"- {problem}")
    print(f"problem_count={len(problems)}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
