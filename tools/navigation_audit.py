#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

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

REQUIRED_LABELS = ["教室トップ", "初回体験", "クラス", "教室紹介", "ワークショップ", "サービス一覧", "FAQ", "アクセス", "RSS"]
LEGACY_SHOP_LABEL = "メインHP・SHOP"


class PortalLinks(HTMLParser):
    """Read only the portal's single canonical navigation list."""
    def __init__(self):
        super().__init__()
        self.lists = 0
        self.inside = False
        self.anchor = None
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "ul" and "portal-site-links" in attrs.get("class", "").split():
            self.lists += 1
            self.inside = True
        if tag == "a" and self.inside:
            self.anchor = [attrs.get("href", ""), ""]

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor[1] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor is not None:
            self.links.append(tuple(self.anchor))
            self.anchor = None
        if tag == "ul":
            self.inside = False


def portal_problems(text: str) -> list[str]:
    parser = PortalLinks()
    parser.feed(text)
    expected = [
        ("../", "教室トップ"), ("../trial/", "初回体験"),
        ("../classes/", "クラス"), ("../about/", "教室紹介"),
        ("../workshops/", "ワークショップ"), ("./", "サービス一覧"),
        ("../faq/", "FAQ"), ("../access/", "アクセス"),
        ("../rss/", "RSS"), ("https://rhythmspeaker.stores.jp/", "SHOP"),
    ]
    base = "https://noritap.github.io/rhythmspeaker/ecosystem/"
    actual = [(urljoin(base, href), label.strip()) for href, label in parser.links]
    wanted = [(urljoin(base, href), label) for href, label in expected]
    problems = []
    if parser.lists != 1:
        problems.append("SINGLE_PORTAL_NAV_REQUIRED")
    if actual != wanted:
        problems.append("PORTAL_NAV_LABEL_HREF_ORDER_DRIFT")
    if extract_desktop_nav(text) or extract_mobile_nav(text):
        problems.append("DUPLICATE_LEGACY_NAV")
    if LEGACY_SHOP_LABEL in text:
        problems.append("LEGACY_MAIN_HP_SHOP_LABEL")
    return problems


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
        if rel == Path("ecosystem/index.html"):
            miss = portal_problems(text)
            if miss:
                problems.append((str(rel), "shared-desktop-mobile", miss))
            continue
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
