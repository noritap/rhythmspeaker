#!/usr/bin/env python3
"""Compress trial-page photos and audit all referenced local images.

Run from repository root: python scripts/optimize_trial_and_audit_images.py
Requires Pillow for generation. Audit-only mode: --audit (stdlib).
"""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from PIL import Image, ImageOps
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TRIAL = ROOT / "trial/index.html"
PHOTOS = (
    "trial-your-start-body-classes-v2.jpg",
    "trial-real-studio-floor-v1.jpg",
    "trial-real-rental-shoes-v1.jpg",
    "trial-real-lesson-archive-v1.jpg",
)
# Previously published large images remain in the repo as originals, but should
# not be loaded by the trial page once their WebP variants are available.
MAX_NEW_REFERENCED_KB = 400

def optimize():
    html = TRIAL.read_text(encoding="utf-8")
    for filename in PHOTOS:
        src = ROOT / "assets/images/trial" / filename
        if not src.is_file():
            raise FileNotFoundError(src)
        with Image.open(src) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            dst = src.with_suffix(".webp")
            image.save(dst, "WEBP", quality=82, method=6)
            kb = dst.stat().st_size / 1024
            if kb > MAX_NEW_REFERENCED_KB:
                raise ValueError(f"{dst}: {kb:.1f} KiB > {MAX_NEW_REFERENCED_KB} KiB")
            old = f'../assets/images/trial/{filename}'
            new = f'../assets/images/trial/{dst.name}'
            if html.count(old) != 1:
                raise AssertionError(f"Expected exactly one trial reference to {old}")
            html = html.replace(old, new)
            # Existing images missing dimensions get the measured WebP dimensions.
            # This applies only to the three actual lesson/facility photos.
            if filename != PHOTOS[0]:
                marker = f'src="{new}"'
                html = html.replace(marker, f'{marker} width="{image.width}" height="{image.height}"')
            print(f"{filename} -> {dst.name}: {kb:.1f} KiB ({image.width}x{image.height})")
    TRIAL.write_text(html, encoding="utf-8")

def audit():
    """Report local assets referenced from HTML/CSS and flag broken links or oversized assets."""
    missing, oversized, checked = [], [], set()
    sources = list(ROOT.rglob("*.html")) + list(ROOT.rglob("*.css"))
    pattern = re.compile(r'(?:(?:src|poster|srcset)\s*=\s*["\']([^"\']+)["\']|url\(\s*["\']?([^)"\']+))', re.I)
    for source in sources:
        text = source.read_text(encoding="utf-8")
        for match in pattern.finditer(text):
            raw = match.group(1) or match.group(2)
            for item in raw.split(","):
                url = item.strip().split()[0].strip("'\"")
                url = unquote(urlsplit(url).path)
                if not url or url.startswith(("data:", "//", "http:","https:","#")):
                    continue
                if not re.search(r'\.(png|jpe?g|webp|avif|gif|svg)$', url, re.I):
                    continue
                if url.startswith("/rhythmspeaker/"):
                    target = ROOT / url.removeprefix("/rhythmspeaker/")
                elif url.startswith("/"):
                    continue  # unrelated absolute host path
                else:
                    target = source.parent / url
                target = target.resolve()
                if not target.is_relative_to(ROOT):
                    continue
                if not target.exists():
                    missing.append((str(source.relative_to(ROOT)), url))
                elif target not in checked:
                    checked.add(target)
                    kb = target.stat().st_size / 1024
                    if kb > MAX_NEW_REFERENCED_KB:
                        oversized.append((str(target.relative_to(ROOT)), round(kb)))
    print(f"IMAGE AUDIT: {len(checked)} referenced local images, {len(missing)} missing, {len(oversized)} > {MAX_NEW_REFERENCED_KB} KiB")
    for path, kb in sorted(oversized, key=lambda x: -x[1]):
        print(f"LARGE: {path} ({kb} KiB)")
    for source, url in missing:
        print(f"MISSING: {source} -> {url}")
    # Avoid failing the build on legacy large photos elsewhere. Require the
    # trial page's new assets to be valid and small, and report the global backlog.
    html = TRIAL.read_text(encoding="utf-8")
    for filename in PHOTOS:
        name = Path(filename).with_suffix(".webp").name
        dst = ROOT / "assets/images/trial" / name
        if not dst.is_file() or dst.stat().st_size > MAX_NEW_REFERENCED_KB * 1024:
            raise AssertionError(f"Missing or oversized optimized trial asset: {name}")
        if f'../assets/images/trial/{filename}' in html:
            raise AssertionError(f"Old JPEG still used: {filename}")
    if any(src == "trial/index.html" for src, _ in missing):
        raise AssertionError("Trial page has missing image references")
    print("PASS: optimized trial photos and trial-page local image links")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", action="store_true")
    args = parser.parse_args()
    if not args.audit:
        optimize()
    audit()
