#!/usr/bin/env python3
"""Image quality gate for official site (read-only, stdlib).

Audit HTML/CSS local image references and intrinsic dimensions. On PRs, fail
only on NEW broken local references, NEW undimensioned images and NEW oversized
images. Existing debt is reported rather than blocking unrelated changes.
Workshop preview and externally hosted thumbnails are excluded from this gate.
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
EXT = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"}
LIMIT = 400 * 1024
EXCLUDED = ("workshops/", "ui-style-catalog/")
URL_RE = re.compile(r"url\(\s*['\"]?([^)'\"]+)", re.I)

def run(*args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, check=True).stdout

def target_for(source, url):
    url = url.strip().split()[0].strip("'\"")
    if not url or url.startswith(("data:", "//", "#")):
        return None
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc:
        return None
    path = unquote(parsed.path)
    if not path or Path(path).suffix.lower() not in EXT:
        return None
    if path.startswith("/rhythmspeaker/"):
        target = ROOT / path.removeprefix("/rhythmspeaker/")
    elif path.startswith("/"):
        return None
    else:
        target = source.parent / path
    target = target.resolve()
    return target if target.is_relative_to(ROOT) else None

class Images(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []
    def handle_starttag(self, tag, attrs):
        if tag in ("img", "source"):
            self.tags.append((tag, dict(attrs), self.getpos()[0]))

def audit_file(source):
    relative = source.relative_to(ROOT).as_posix()
    if relative.startswith(EXCLUDED):
        return []
    content = source.read_text(encoding="utf-8")
    issues = []
    def check(url, line):
        target = target_for(source, url)
        if target is not None and not target.is_file():
            issues.append((relative, line, "missing", url))
    if source.suffix == ".html":
        parser = Images()
        parser.feed(content)
        for tag, attrs, line in parser.tags:
            for attr in ("src", "poster"):
                if attrs.get(attr):
                    check(attrs[attr], line)
            if attrs.get("srcset"):
                for item in attrs["srcset"].split(","):
                    if item.strip():
                        check(item, line)
            if tag == "img":
                src = attrs.get("src", "")
                if src and not src.startswith(("data:", "http:", "https:", "//")):
                    if not (attrs.get("width", "").isdigit() and attrs.get("height", "").isdigit()):
                        # Logo/icons may be intentionally dimensioned via CSS; report
                        # but do not block legacy debt unless the img is newly added.
                        issues.append((relative, line, "dimensions", src))
    for match in URL_RE.finditer(content):
        check(match.group(1), content.count("\n", 0, match.start()) + 1)
    return issues

def changed(base):
    # Fetch full main history in the workflow before comparing.
    out = run("git", "diff", "--name-only", "--diff-filter=ACMR", f"{base}...HEAD")
    return [Path(p) for p in out.splitlines()]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", help="PR base branch, e.g. origin/main")
    parser.add_argument("--json", dest="json_path")
    args = parser.parse_args()
    sources = [p for ext in ("*.html", "*.css") for p in ROOT.rglob(ext)
               if not p.relative_to(ROOT).as_posix().startswith(EXCLUDED)]
    all_issues = [issue for source in sources for issue in audit_file(source)]
    changes = changed(args.base) if args.base else []
    touched = {p.as_posix() for p in changes}
    changed_sources = [p for p in changes if p.suffix in (".html", ".css") and (ROOT / p).is_file()
                       and not p.as_posix().startswith(EXCLUDED)]
    # Compare to the base version of the SAME source to avoid treating
    # pre-existing debt as new. Issue keys intentionally ignore line numbers.
    new_issues = []
    for path in changed_sources:
        current = audit_file(ROOT / path)
        try:
            previous = run("git", "show", f"{args.base}:{path.as_posix()}")
        except subprocess.CalledProcessError:
            previous = ""
        # For baseline comparisons, materialize old content into a temporary
        # sibling only in memory by comparing normalized tag/URL issue counts.
        baseline = set()
        if previous:
            from tempfile import TemporaryDirectory
            with TemporaryDirectory(dir=ROOT / path.parent) as temp:
                old = Path(temp) / path.name
                old.write_text(previous, encoding="utf-8")
                for _, _, kind, detail in audit_file(old):
                    baseline.add((kind, detail))
        for issue in current:
            if (issue[2], issue[3]) not in baseline:
                new_issues.append(issue)
    oversized = []
    for p in changes:
        file = ROOT / p
        if file.is_file() and file.suffix.lower() in EXT and not p.as_posix().startswith(EXCLUDED):
            if file.stat().st_size > LIMIT:
                oversized.append((p.as_posix(), file.stat().st_size))
    result = {
        "scanned_sources": len(sources),
        "existing_issues": len(all_issues),
        "new_issues": new_issues,
        "new_oversized": oversized,
        "policy": "Only new regressions fail; legacy issues are reported."
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.json_path:
        Path(args.json_path).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    if new_issues or oversized:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
