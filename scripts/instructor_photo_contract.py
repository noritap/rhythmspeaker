#!/usr/bin/env python3
"""Guard the TOP-page instructor photo contract across official web surfaces.

The 10 TOP portraits are the canonical images. Other instructor-introduction
surfaces must reuse the same CSS variables, not legacy Wix/sprite portraits.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = {
    "mifa": "instructor-mifa-editorial-v2-960w.webp",
    "homma": "instructor-honma-editorial-v1-960w.webp",
    "sasasa": "instructor-sasasa-editorial-v1-960w.webp",
    "niu": "instructor-nibu-editorial-v1-960w.webp",
    "nao": "instructor-nao-editorial-v1-960w.webp",
    "kattun": "instructor-kattun-editorial-v1-960w.webp",
    "okudaira": "instructor-okudaira-editorial-v1-960w.webp",
    "saito": "instructor-saito-hiroaki-editorial-v1-960w.webp",
    "pal": "instructor-pal-editorial-v1-960w.webp",
    "furusho": "instructor-furusho-editorial-v1-960w.webp",
}
STEP_ORDER = ["mifa", "homma", "sasasa", "niu", "okudaira", "furusho"]
LEGACY = ("static.wixstatic.com/media/", "stretch-visual-sheet.webp",
          "tap-dance-instructor-furusho-noritaka.jpg")
SOURCES = (
    "style.css",
    "instructors/style.css",
    "instructors/profile.css",
    "classes/detail.css",
    "classes/step/index.html",
)
errors: list[str] = []


def source(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        errors.append(f"missing source: {path}")
        return ""
    return file.read_text(encoding="utf-8")


def expect(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def css_photo_selector(css: str, selector: str, key: str, path: str) -> None:
    # Require the canonical CSS variable in the matching class declaration.
    pattern = (re.escape(selector) +
               r"\s*\{[^}]*background-image\s*:\s*var\(\s*--rs-instructor-photo-" +
               re.escape(key) + r"\s*\)")
    expect(bool(re.search(pattern, css)), f"{path}: {selector} must use {key} canonical photo")


def main() -> int:
    top = source("style.css")
    hub = source("instructors/style.css")
    profile = source("instructors/profile.css")
    tap = source("classes/detail.css")
    step = source("classes/step/index.html")
    finder = source("instructors/index.html")
    about = source("about/index.html")
    framing = source("instructors/photo-framing.css")

    for key, filename in PHOTOS.items():
        expect((ROOT / "assets/instructors" / filename).is_file(),
               f"missing approved photo asset: {filename}")
        decl = (rf"--rs-instructor-photo-{key}\s*:\s*"
                rf"url\(['\"]?/rhythmspeaker/assets/instructors/{re.escape(filename)}"
                rf"(?:\?[^)'\" ]+)?['\"]?\)")
        expect(bool(re.search(decl, top)), f"style.css: missing canonical photo URL for {key}")
        homepage_key = "saito-hiroaki" if key == "saito" else key
        css_photo_selector(top, f".p-{homepage_key}", key, "style.css")
        css_photo_selector(hub, f".person-photo--{key}", key, "instructors/style.css")
        expect(f"person-photo--{key}" in finder,
               f"instructors/index.html: missing photo slot for {key}")

    for key in STEP_ORDER:
        css_photo_selector(profile, f".profile-photo--{key}", key,
                           "instructors/profile.css")
        css_photo_selector(tap, f".tap-style-photo--{key}", key,
                           "classes/detail.css")
    for n, key in enumerate(STEP_ORDER, 1):
        css_photo_selector(step, f".step-page .instructor-card:nth-child({n}):before",
                           key, "classes/step/index.html")

    expect('src="../assets/instructors/instructor-furusho-editorial-v1-960w.webp"' in about,
           "about/index.html: Furusho portrait must match TOP")
    for path in SOURCES:
        body = source(path)
        for token in LEGACY:
            expect(token not in body, f"{path}: legacy instructor photo reference {token}")
    expect("stretch-visual-sheet" not in framing,
           "photo-framing.css: old sprite crop policy")
    expect("filter:brightness" not in framing,
           "photo-framing.css: old photo-color modifications")

    try:
        catalog = json.loads(source("instructors/instructor-catalog.json"))
        for person in catalog["instructors"]:
            key = person["id"]
            if key in PHOTOS:
                expected = "/assets/instructors/" + PHOTOS[key]
                expect(person["photo"]["asset"] == expected,
                       f"instructor-catalog.json: {key} asset must match TOP")
    except (ValueError, KeyError, TypeError) as exc:
        errors.append(f"invalid instructor catalog: {exc}")

    if errors:
        print("INSTRUCTOR PHOTO CONTRACT: FAIL")
        for error in errors:
            print(" - " + error)
        return 1
    print("INSTRUCTOR PHOTO CONTRACT: PASS (10 canonical portraits; STEP/TAP/profile/about checked)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
