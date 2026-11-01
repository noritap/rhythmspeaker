#!/usr/bin/env python3
"""Validate one canonical, priority-ranked right-header menu on every primary page."""
from __future__ import annotations
import argparse
import re
from pathlib import Path
from navigation_sync import PAGES, render_menu


def menu_problems(text: str, prefix: str, current: str) -> list[str]:
    issues = []
    target = render_menu(prefix, current)
    if text.count(target) != 1:
        issues.append("PRIORITY_MENU_CONTENT_OR_ORDER_DRIFT")
    if len(re.findall(r'<nav class="rs-menu-nav"', text)) != 1:
        issues.append("SINGLE_MENU_NAV_REQUIRED")
    # These were the previous overlapping mobile/desktop lists.
    if re.search(r'class="(?:nav-links|mobile-nav-panel|portal-site-links|ux-extra-nav|portal-menu-entry)"', text):
        issues.append("DUPLICATE_LEGACY_NAV")
    if "メインHP・SHOP" in text or "通常クラス予約" in text:
        issues.append("LEGACY_NAV_LABEL")
    if "aria-controls=\"menu\"" not in text:
        issues.append("MENU_TOGGLE_MISSING")
    return issues


def portal_problems(text: str) -> list[str]:
    return menu_problems(text, "../", "ecosystem/")


def audit(root: Path) -> list[tuple[str, str, list[str]]]:
    problems = []
    for page, current in PAGES.items():
        target = root / page
        if not target.exists():
            problems.append((str(page), "menu", ["FILE_MISSING"]))
            continue
        prefix = "" if page == Path("index.html") else "../"
        issues = menu_problems(target.read_text(encoding="utf-8"), prefix, current)
        if issues:
            problems.append((str(page), "menu", issues))
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Rhythm Speaker purpose-ranked navigation")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    issues = audit(args.root)
    if not issues:
        print(f"NAVIGATION AUDIT: PASS ({len(PAGES)} primary routes)")
        return 0
    print("NAVIGATION AUDIT: DRIFT DETECTED")
    for page, surface, problems in issues:
        print(f"- {page} [{surface}]: {', '.join(problems)}")
    print(f"drift_records={len(issues)}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
