#!/usr/bin/env python3
"""Optimize homepage/instructor CSS background photos without changing source photos."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
INSTRUCTORS = [
    "instructor-mifa-editorial-v2", "instructor-honma-editorial-v1",
    "instructor-sasasa-editorial-v1", "instructor-nibu-editorial-v1",
    "instructor-nao-editorial-v1", "instructor-kattun-editorial-v1",
    "instructor-okudaira-editorial-v1", "instructor-saito-hiroaki-editorial-v1",
    "instructor-furusho-editorial-v1", "instructor-pal-editorial-v1",
]
STUDIO = "home-studio-experience-v2"
MAX_KB = 400

def convert(source, widths):
    if not source.exists():
        raise FileNotFoundError(source)
    outputs = []
    with Image.open(source) as raw:
        img = ImageOps.exif_transpose(raw)
        img = img.convert("RGBA" if "A" in img.getbands() or "transparency" in img.info else "RGB")
        for width in widths:
            resized = img.copy()
            resized.thumbnail((width, 10000), Image.Resampling.LANCZOS)
            output = source.with_name(f"{source.stem}-{width}w.webp")
            resized.save(output, "WEBP", quality=82, method=6)
            kb = output.stat().st_size / 1024
            if kb > MAX_KB:
                raise ValueError(f"{output} is {kb:.1f} KB (max {MAX_KB} KB)")
            outputs.append((output, kb))
    return outputs

def replace_exact(path, old, new, minimum=1):
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count < minimum:
        raise AssertionError(f"Expected >= {minimum} occurrences of {old} in {path}, got {count}")
    text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    return count

def main():
    output = []
    for name in INSTRUCTORS:
        source = ROOT / "assets/instructors" / f"{name}.png"
        output += convert(source, (480, 960))
        for css in (ROOT / "style.css", ROOT / "instructors/style.css"):
            text = css.read_text(encoding="utf-8")
            # Only replace assets actually used in the CSS; leave historic sources untouched.
            if f"{name}.png" in text:
                text = text.replace(f"{name}.png", f"{name}-960w.webp")
                css.write_text(text, encoding="utf-8")
    studio = ROOT / "assets" / f"{STUDIO}.png"
    output += convert(studio, (960, 1600))
    replace_exact(ROOT / "style.css", f"{STUDIO}.png", f"{STUDIO}-1600w.webp")
    # Mobile breakpoint loads smaller background when the section is reached.
    css = ROOT / "style.css"
    text = css.read_text(encoding="utf-8")
    text += (
        "\n/* Responsive studio background: same photograph, smaller mobile transfer. */\n"
        "@media (max-width:720px){\n"
        "  .home-rebuild .rb-studio-visual{\n"
        "    background-image:linear-gradient(90deg,rgba(5,5,5,.76),rgba(5,5,5,.28) 55%,rgba(5,5,5,.04)),"
        "url('/rhythmspeaker/assets/home-studio-experience-v2-960w.webp?v=20260927');\n"
        "  }\n"
        "}\n"
    )
    css.write_text(text, encoding="utf-8")
    for name in INSTRUCTORS:
        for css in (ROOT / "style.css", ROOT / "instructors/style.css"):
            if f"{name}.png" in css.read_text(encoding="utf-8"):
                raise AssertionError(f"Unoptimized instructor CSS: {css}, {name}")
    if f"{STUDIO}.png" in css.read_text(encoding="utf-8"):
        raise AssertionError("Unoptimized studio CSS")
    if len(output) != 22:
        raise AssertionError(f"Expected 22 files, got {len(output)}")
    for file, kb in output:
        print(f"{file.relative_to(ROOT)}: {kb:.1f} KiB")
    print("PASS: 10 instructors x 2 + studio x 2, homepage and instructor CSS")

if __name__ == "__main__":
    main()
