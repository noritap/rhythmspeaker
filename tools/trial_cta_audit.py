#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

CANONICAL_TRIAL_LINE_URL = (
    "https://line.me/R/oaMessage/%40ypk3334t/"
    "?%E5%88%9D%E5%9B%9E%E4%BD%93%E9%A8%93%E3%82%92%E5%B8%8C%E6%9C%9B%E3%81%97%E3%81%BE%E3%81%99%E3%80%82"
)

PAGES = [
    Path("index.html"),
    Path("trial/index.html"),
    Path("classes/index.html"),
    Path("about/index.html"),
    Path("ecosystem/index.html"),
    Path("faq/index.html"),
    Path("access/index.html"),
]

ANCHOR_RE = re.compile(r'<a\b([^>]*)href="([^"]+)"([^>]*)>(.*?)</a>', re.S | re.I)
TAG_RE = re.compile(r"<[^>]+>")
CLASS_RE = re.compile(r'class="([^"]*)"', re.I)


def visible_text(html: str) -> str:
    return re.sub(r"\s+", " ", TAG_RE.sub("", html)).strip()


def class_tokens(attrs: str) -> set[str]:
    match = CLASS_RE.search(attrs)
    if not match:
        return set()
    return set(match.group(1).split())


def is_trial_conversion_anchor(attrs: str, body: str) -> bool:
    classes = class_tokens(attrs)
    text = visible_text(body)

    # Internal discovery links such as "初回体験" / "初回体験を見る" correctly
    # route to /trial/. The direct LINE contract applies only to explicit
    # booking/consultation CTAs and the navigation conversion button.
    if "cta-nav" in classes:
        return True
    if "btn" not in classes:
        return False
    return (
        "体験予約" in text
        or "体験日時" in text
        or ("LINE" in text and "体験" in text)
    )


def audit(root: Path) -> list[tuple[str, str, str]]:
    problems: list[tuple[str, str, str]] = []
    for rel in PAGES:
        path = root / rel
        if not path.exists():
            problems.append((str(rel), "FILE_MISSING", ""))
            continue

        html = path.read_text(encoding="utf-8")
        matched_trial_anchor = False
        for match in ANCHOR_RE.finditer(html):
            attrs = f"{match.group(1)} {match.group(3)}"
            href = match.group(2)
            body = match.group(4)
            if not is_trial_conversion_anchor(attrs, body):
                continue
            matched_trial_anchor = True
            if href != CANONICAL_TRIAL_LINE_URL:
                problems.append((str(rel), visible_text(body), href))

        if not matched_trial_anchor:
            problems.append((str(rel), "TRIAL_CTA_MISSING", ""))

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit trial LINE CTA consistency")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    problems = audit(args.root)
    if not problems:
        print("TRIAL CTA AUDIT: PASS")
        print(f"canonical_url={CANONICAL_TRIAL_LINE_URL}")
        return 0

    print("TRIAL CTA AUDIT: DRIFT DETECTED")
    for page, label, href in problems:
        if label == "FILE_MISSING":
            print(f"- {page}: file missing")
        elif label == "TRIAL_CTA_MISSING":
            print(f"- {page}: no direct trial conversion CTA detected")
        else:
            print(f"- {page}: {label!r} -> {href}")
    print(f"drift_records={len(problems)}")
    return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
