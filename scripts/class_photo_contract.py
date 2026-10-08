#!/usr/bin/env python3
"""Sitewide public class-photo identity contract (stdlib only).

TOP is the canonical source for the six square editorial class images.
This gate verifies that /classes/ and each class detail reuse the same
assets without crop, while studio/wayfinding and instructor photos have
their own appropriate sources.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLASSES = {
    "step": "class-step-editorial-v3",
    "tap": "class-tap-editorial-v1",
    "stretch": "class-stretch-editorial-v1",
    "isolation": "class-isolation-editorial-v1",
    "bar-method": "class-bar-method-editorial-v1",
    "hiit": "class-hiit-editorial-v1",
}
errors = []


def read(path):
    file = ROOT / path
    if not file.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


def expect(ok, message):
    if not ok:
        errors.append(message)


def main():
    home = read("index.html")
    finder = read("classes/index.html")
    shared = read("classes/photo-system.css")
    access = read("access/index.html")
    stretch = read("classes/stretch/index.html")

    for slug, stem in CLASSES.items():
        small = f"{stem}-640w.webp"
        large = f"{stem}-1100w.webp"
        for filename in (small, large):
            expect((ROOT / "assets/classes" / filename).is_file(),
                   f"{slug}: missing approved class artwork {filename}")
        # TOP and class finder must both point to exactly the same canonical
        # file family, rather than merely displaying a visually similar shot.
        home_anchor = f'href="classes/{slug}/"'
        expect(home_anchor in home, f"TOP: missing class link {slug}")
        home_window = home.split(home_anchor, 1)[-1][:800]
        expect(f'src="assets/classes/{small}"' in home_window,
               f"TOP: {slug} must use canonical 640w poster")
        expect(f"assets/classes/{large}" in home_window,
               f"TOP: {slug} must provide canonical 1100w srcset")

        finder_anchor = f'id="class-{slug}"'
        expect(finder_anchor in finder, f"/classes/: missing class {slug}")
        finder_window = finder.split(finder_anchor, 1)[-1][:800]
        expect(f'src="../assets/classes/{small}"' in finder_window,
               f"/classes/: {slug} must match TOP poster")
        expect(f"../assets/classes/{large}" in finder_window,
               f"/classes/: {slug} must provide 1100w variant")

        detail = read(f"classes/{slug}/index.html")
        cls = "stretch-identity-photo" if slug == "stretch" else "class-identity-photo"
        expect(f'class="{cls}" src="../../assets/classes/{large}"' in detail,
               f"{slug} detail: missing canonical TOP photo")
        expect('width="1100" height="1100"' in detail,
               f"{slug} detail: class artwork must have intrinsic dimensions")
        expect('href="../photo-system.css"' in detail,
               f"{slug} detail: missing shared no-crop stylesheet")

    expect('href="photo-system.css"' in finder,
           "/classes/: missing shared photo system")
    expect(".classes-page .class-card-image" in shared and
           "object-fit: contain" in shared and "aspect-ratio: 1 / 1" in shared,
           "Class finder: photos must use 1:1 contain framing")
    expect(".step-page #levels .class-card::before" in shared and
           ".tap-page #concept .class-card::before" in shared and
           "content: none" in shared,
           "STEP/TAP: repeated generic dancer images must be disabled")
    expect(".tap-page #instructors .tap-style-photo" in shared,
           "TAP: full instructor artwork framing is required")

    expect("stretch-visual-sheet.webp" not in access,
           "/access/: do not use stretch outcomes as location evidence")
    expect("../assets/images/trial/trial-real-studio-floor-v1.webp" in access,
           "/access/: use grounded studio photo")
    expect(".access-page-v3 .route-card:before{content:none}" in access,
           "/access/: generic dancer photo must not impersonate route imagery")

    for person in ("mifa-editorial-v2", "furusho-editorial-v1"):
        expect(f"instructor-{person}-960w.webp" in stretch,
               f"STRETCH team: use canonical TOP portrait for {person}")
    expect("本人写真は、HP向け素材を確定後" not in stretch,
           "STRETCH team: remove outdated placeholder photo notice")

    if errors:
        print("CLASS PHOTO CONTRACT: FAIL")
        for message in errors:
            print(" -", message)
        return 1
    print("CLASS PHOTO CONTRACT: PASS (6 TOP/class finder/detail identities,")
    print("  full-square fitting, STEP/TAP no-repeat, real access, STRETCH team)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
