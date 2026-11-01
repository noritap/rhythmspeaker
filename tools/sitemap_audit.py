#!/usr/bin/env python3
"""Deterministic, privacy-safe sitemap generator and route inventory audit.

Source of truth: docs/seo/page-registry.json. Never invent lastmod dates.
New HTML files must be explicitly classified before they can be published.
"""
import argparse
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "docs/seo/page-registry.json"
SITEMAP = ROOT / "sitemap.xml"
XMLNS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def load_registry(root=ROOT):
    obj = json.loads((root / "docs/seo/page-registry.json").read_text(encoding="utf-8"))
    assert obj["base_url"] == "https://noritap.github.io/rhythmspeaker/"
    assert obj["version"] == 1
    return obj


def url_for(path, base):
    if path == "index.html":
        return base
    return base + (path[:-10] if path.endswith("/index.html") else path)


def render(obj):
    root = ET.Element("urlset", xmlns=XMLNS)
    for path in obj["public_html"]:
        item = ET.SubElement(root, "url")
        ET.SubElement(item, "loc").text = url_for(path, obj["base_url"])
    ET.indent(root, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def check(root=ROOT):
    obj = load_registry(root)
    public = obj["public_html"]
    excluded = obj["excluded_html"]
    if len(public) != len(set(public)) or public != sorted(public):
        raise ValueError("public_html must be sorted and unique")
    if set(public) & set(excluded):
        raise ValueError("a path cannot be both published and excluded")
    for path in list(public) + list(excluded):
        if not path.endswith(".html") or path.startswith("/") or ".." in Path(path).parts:
            raise ValueError("invalid route path " + path)
    tracked = set(subprocess.check_output(
        ["git", "ls-files", "--", "*.html"], cwd=root, text=True).splitlines())
    declared = set(public) | set(excluded)
    if tracked != declared:
        raise ValueError(
            "unclassified HTML paths; missing=%s unexpected=%s"
            % (sorted(tracked - declared), sorted(declared - tracked))
        )
    for path in public:
        html = (root / path).read_text(encoding="utf-8")
        if re.search(r'<meta[^>]*name=["\\\']robots["\\\'][^>]*content=["\\\'][^"\\\']*noindex', html, re.I):
            raise ValueError("public sitemap URL is noindex: " + path)
        canonical = re.search(r'<link[^>]*rel=["\\\']canonical["\\\'][^>]*href=["\\\']([^"\\\']+)', html, re.I)
        if canonical and canonical.group(1) != url_for(path, obj["base_url"]):
            raise ValueError("canonical mismatch in " + path)
    for path, reason in excluded.items():
        if reason.startswith("noindex:"):
            html = (root / path).read_text(encoding="utf-8")
            if not re.search(r'<meta[^>]*name=["\\\']robots["\\\'][^>]*content=["\\\'][^"\\\']*noindex', html, re.I):
                raise ValueError("excluded page missing noindex meta: " + path)
        elif not reason.startswith("dynamic:"):
            raise ValueError("unknown exclusion policy: " + path)
    expected = render(obj)
    actual = (root / "sitemap.xml").read_text(encoding="utf-8")
    if actual != expected:
        raise ValueError("sitemap.xml out of sync; run python tools/sitemap_audit.py --write")
    parsed = ET.fromstring(actual)
    locs = [node.text for node in parsed.findall(".//{" + XMLNS + "}loc")]
    if len(locs) != len(public) or len(locs) != len(set(locs)):
        raise ValueError("sitemap URL count/uniqueness mismatch")
    return len(public), len(excluded)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="regenerate sitemap.xml")
    args = parser.parse_args()
    try:
        if args.write:
            SITEMAP.write_text(render(load_registry()), encoding="utf-8")
        public, excluded = check()
    except (ValueError, OSError, AssertionError, subprocess.CalledProcessError) as exc:
        print("SITEMAP AUDIT FAIL:", exc)
        return 1
    print("SITEMAP AUDIT PASS: %d public URLs; %d excluded HTML routes" % (public, excluded))
    return 0


if __name__ == "__main__":
    sys.exit(main())
