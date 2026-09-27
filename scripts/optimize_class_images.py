#!/usr/bin/env python3
"""Generate responsive WebP class images and update homepage + class finder.

Run from the repository root: python3 scripts/optimize_class_images.py
Requires: pip install Pillow
"""
from pathlib import Path
from PIL import Image, ImageOps
import re

ROOT = Path(__file__).resolve().parents[1]
NAMES = [
    "class-step-editorial-v3", "class-tap-editorial-v1",
    "class-stretch-editorial-v1", "class-isolation-editorial-v1",
    "class-bar-method-editorial-v1", "class-hiit-editorial-v1",
]
SIZES = (640, 1100)
MAX_KB = 350

def generate():
    results = []
    for name in NAMES:
        source = ROOT / "assets/classes" / (name + ".png")
        if not source.is_file():
            raise FileNotFoundError(source)
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw)
            # Retain transparency, when present.
            image = image.convert("RGBA" if "A" in image.getbands() or "transparency" in image.info else "RGB")
            width, height = image.size
            for target in SIZES:
                resized = image.copy()
                resized.thumbnail((target, target * 4), Image.Resampling.LANCZOS)
                dest = source.with_name(f"{name}-{target}w.webp")
                resized.save(dest, "WEBP", quality=82, method=6)
                kb = dest.stat().st_size / 1024
                results.append((str(dest.relative_to(ROOT)), round(kb), resized.size))
                if kb > MAX_KB:
                    raise ValueError(f"{dest} is {kb:.0f} KB (limit {MAX_KB} KB)")
    return results

def rewrite():
    home = ROOT / "index.html"
    text = home.read_text(encoding="utf-8")
    for name in NAMES:
        old = f'assets/classes/{name}.png?v=20260919'
        new = (f'assets/classes/{name}-640w.webp" '
               f'srcset="assets/classes/{name}-640w.webp 640w, '
               f'assets/classes/{name}-1100w.webp 1100w" '
               f'sizes="(max-width: 720px) 92vw, (max-width: 1200px) 48vw, 32vw" '
               f'width="1100" height="1100')
        needle = f'src="{old}"'
        if text.count(needle) != 1:
            raise ValueError(f"Expected one homepage img reference for {name}, found {text.count(needle)}")
        text = text.replace(needle, f'src="{new}"')
    home.write_text(text, encoding="utf-8")

    classes = ROOT / "classes/index.html"
    text = classes.read_text(encoding="utf-8")
    for name in NAMES:
        old = f'../assets/classes/{name}.png'
        new = (f'../assets/classes/{name}-640w.webp" '
               f'srcset="../assets/classes/{name}-640w.webp 640w, '
               f'../assets/classes/{name}-1100w.webp 1100w" '
               f'sizes="(max-width: 720px) 92vw, (max-width: 1200px) 48vw, 32vw" '
               f'width="1100" height="1100')
        needle = f'src="{old}"'
        if text.count(needle) != 1:
            raise ValueError(f"Expected one class finder img reference for {name}, found {text.count(needle)}")
        text = text.replace(needle, f'src="{new}"')
    classes.write_text(text, encoding="utf-8")

    css = ROOT / "style.css"
    text = css.read_text(encoding="utf-8")
    for name in NAMES:
        text = text.replace(f'{name}.png?v=20260919', f'{name}-1100w.webp?v=20260927')
    css.write_text(text, encoding="utf-8")

def verify():
    for page in ("index.html", "classes/index.html"):
        html = (ROOT / page).read_text(encoding="utf-8")
        for name in NAMES:
            if f'{name}.png' in html or f'{name}-640w.webp' not in html:
                raise AssertionError(f"Broken replacement: {page}, {name}")
            for size in SIZES:
                if not (ROOT / "assets/classes" / f"{name}-{size}w.webp").is_file():
                    raise AssertionError(f"Missing output {name}-{size}w.webp")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    for name in NAMES:
        if f'{name}.png' in css:
            raise AssertionError(f"Unoptimized CSS background: {name}")
    print("PASS: six class images, two responsive widths, two HTML pages and CSS references")

if __name__ == "__main__":
    results = generate()
    rewrite()
    verify()
    for path, kb, dims in results:
        print(f"{path}: {kb} KiB, {dims[0]}x{dims[1]}")
