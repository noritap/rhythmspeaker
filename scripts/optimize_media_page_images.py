#!/usr/bin/env python3
"""3VC: optimize music images and reserve layout for broadcast/RSS thumbnails.

Original files and social-sharing OG images remain unchanged.
Run from repository root: python scripts/optimize_media_page_images.py
"""
from pathlib import Path
import re
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MUSIC = ROOT / "music/index.html"
ASSETS = [
    "music/assets/brand/RSM_monogram_white_on_black.png",
    "music/assets/images/albums/saa-ittemiyouka/saa-ittemiyouka_B_cover-published_1x1.jpg",
]

def optimize_music():
    html = MUSIC.read_text(encoding="utf-8")
    for relative in ASSETS:
        source = ROOT / relative
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            image = image.convert("RGBA" if image.mode in ("RGBA", "P") and ("A" in image.getbands() or "transparency" in image.info) else "RGB")
            image.thumbnail((900, 900), Image.Resampling.LANCZOS)
            target = source.with_suffix(".webp")
            target.parent.mkdir(parents=True, exist_ok=True)
            target_tmp = target.with_suffix(".webp.tmp")
            image.save(target_tmp, format="WEBP", quality=83, method=6)
            target_tmp.replace(target)
            if target.stat().st_size > 250 * 1024:
                raise ValueError(f"Music asset over 250KiB: {target}")
            old = "./" + str(Path(relative).relative_to("music"))
            new = "./" + str(target.relative_to(ROOT / "music"))
            # Replace rendered src only; leave OG metadata pointing to stable PNG.
            pattern = re.compile(r'(<img\b[^>]*\bsrc=")' + re.escape(old) + r'("[^>]*>)')
            def change(match):
                tag = match.group(1) + new + match.group(2)
                if "width=" not in tag:
                    tag = tag[:-1] + f' width="{image.width}" height="{image.height}">'
                return tag
            html, count = pattern.subn(change, html)
            if not count:
                raise AssertionError(f"Missing rendered music image: {old}")
            print(f"MUSIC: {target.relative_to(ROOT)} {target.stat().st_size//1024}KiB, {count} refs")
    # The remote YouTube maxresdefault thumbnail is landscape.
    html = re.sub(r'(<img\b[^>]*\bsrc="https://i\.ytimg\.com/vi/696Y1S6KX5Q/maxresdefault\.jpg"[^>]*)(>)',
                  lambda m: m.group(1) + ('' if 'width=' in m.group(1) else ' width="1280" height="720"') + m.group(2), html)
    MUSIC.write_text(html, encoding="utf-8")

def set_dimensions(path, pattern, width, height):
    text = path.read_text(encoding="utf-8")
    def amend(match):
        tag = match.group(0)
        if 'width=' in tag and 'height=' in tag:
            return tag
        if 'width=' in tag or 'height=' in tag:
            raise AssertionError(f"Partially dimensioned img in {path}: {tag}")
        return tag[:-1] + f' width="{width}" height="{height}">'
    updated, count = re.subn(r'<img\b[^>]*>', lambda m: amend(m) if re.search(pattern, m.group(0)) else m.group(0), text, flags=re.I)
    if not count:
        raise AssertionError(f"No images in {path}")
    path.write_text(updated, encoding="utf-8")
    return sum(1 for x in re.findall(r'<img\b[^>]*>', updated) if re.search(pattern, x))

def main():
    optimize_music()
    broadcast = ROOT / "broadcast/index.html"
    set_dimensions(broadcast, r'hero-v3\.webp', 1556, 1011)
    program = ROOT / "broadcast/programs/ayako-no-heya/index.html"
    set_dimensions(program, r'i\.ytimg\.com/vi/', 1280, 720)
    rss = ROOT / "rss/014/index.html"
    set_dimensions(rss, r'img\.youtube\.com/vi/', 480, 360)
    # Preserve lazy-loading and onerror fallback on RSS thumbnails.
    for page, marker in [(broadcast, 'hero-v3.webp'), (program, 'maxresdefault.jpg'), (rss, 'hqdefault.jpg')]:
        content = page.read_text(encoding="utf-8")
        assert marker in content
    print("PASS: media assets optimized; MUSIC, BROADCAST, RSS image dimensions reserved")

if __name__ == "__main__":
    main()
