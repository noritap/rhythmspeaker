#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

PAGES = [
    Path("index.html"),
    Path("trial/index.html"),
    Path("classes/index.html"),
    Path("about/index.html"),
    Path("ecosystem/index.html"),
    Path("faq/index.html"),
    Path("access/index.html"),
    Path("rss/index.html"),
]

REQUIRED_LABELS = ["教室トップ", "初回体験", "クラス", "教室紹介", "サービス一覧", "FAQ", "アクセス", "RSS"]
LEGACY_SHOP_LABEL = "メインHP・SHOP"


def extract_desktop_nav(text: str) -> str:
    match = re.search(r'<ul\s+class="nav-links"[^>]*>(.*?)</ul>', text, re.S | re.I)
    return match.group(1) if match else ""


def extract_mobile_nav(text: str) -> str:
    match = re.search(r'<ul\s+class="mobile-nav-panel"[^>]*>(.*?)</ul>', text, re.S | re.I)
    return match.group(1) if match else ""


def missing_items(nav: str) -> list[str]:
    missing = [label for label in REQUIRED_LABELS if label not in nav]
    if ">SHOP<" not in nav:
        missing.append("SHOP")
    if LEGACY_SHOP_LABEL in nav:
        missing.append("LEGACY_MAIN_HP_SHOP_LABEL")
    return missing


def audit(root: Path) -> list[tuple[str, str, list[str]]]:
    problems: list[tuple[str, str, list[str]]] = []
    for rel in PAGES:
        path = root / rel
        if not path.exists():
            problems.append((str(rel), "file", ["FILE_MISSING"]))
            continue
        text = path.read_text(encoding="utf-8")
        desktop = extract_desktop_nav(text)
        mobile = extract_mobile_nav(text)
        if not desktop:
            problems.append((str(rel), "desktop", ["NAV_MISSING"]))
        else:
            miss = missing_items(desktop)
            if miss:
                problems.append((str(rel), "desktop", miss))
        if not mobile:
            problems.append((str(rel), "mobile", ["NAV_MISSING"]))
        else:
            miss = missing_items(mobile)
            if miss:
                problems.append((str(rel), "mobile", miss))
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Rhythm Speaker navigation drift")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    problems = audit(args.root)
    if not problems:
        print("NAVIGATION AUDIT: PASS")
        return 0

    print("NAVIGATION AUDIT: DRIFT DETECTED")
    for page, surface, missing in problems:
        print(f"- {page} [{surface}]: missing {', '.join(missing)}")
    print(f"drift_records={len(problems)}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
