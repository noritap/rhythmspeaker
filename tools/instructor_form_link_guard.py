#!/usr/bin/env python3
"""Static launch gate for Google Forms respondent links; stdlib only."""
import argparse
import pathlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "instructor-submit" / "form-config.js"
TRIVIA = r"(?:\s|/\*.*?\*/|//[^\r\n]*(?:\r?\n|$))*"
PATTERN = re.compile(TRIVIA + r"window\.RS_INSTRUCTOR_FORM_URL\s*=\s*(['\"])([^'\"\\\r\n]*)\1\s*;" + TRIVIA, re.S)


def validate(source: str, require_live: bool = False):
    match = PATTERN.fullmatch(source)
    if not match:
        return False, "Expected exactly one literal RS_INSTRUCTOR_FORM_URL assignment"
    url = match[2]
    if not url:
        return (False, "Form URL not configured") if require_live else (True, "Safe inactive state")
    if re.search(r"\s|[\\\x00-\x1f\x7f]", url):
        return False, "Whitespace, control characters and escapes are not allowed"
    try:
        parsed = urlparse(url)
    except ValueError:
        return False, "Malformed URL"
    if parsed.scheme != "https" or parsed.hostname not in {"docs.google.com", "forms.gle"}:
        return False, "Only HTTPS Google Forms respondent links are permitted"
    if parsed.netloc != parsed.hostname or parsed.fragment or parsed.query:
        return False, "Use a canonical respondent URL without credentials, ports, fragments or query data"
    if parsed.hostname == "docs.google.com" and not re.fullmatch(r"/forms/d/(?:e/)?[A-Za-z0-9_-]+/viewform/?", parsed.path):
        return False, "Use a Google Forms respondent viewform URL, not an edit URL"
    if parsed.hostname == "forms.gle" and not re.fullmatch(r"/[A-Za-z0-9_-]+/?", parsed.path):
        return False, "Invalid forms.gle short link"
    return True, "Respondent URL syntax valid; live response acceptance requires manual QA"


class IntakeHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.config_scripts = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id") == "form-link":
            self.links.append((tag, attrs))
        if tag == "script" and attrs.get("src") == "./form-config.js":
            self.config_scripts += 1


def validate_page(source):
    page = IntakeHTML()
    page.feed(source)
    if len(page.links) != 1 or page.config_scripts != 1:
        return False, "Expected one form-link and one configuration script"
    tag, attrs = page.links[0]
    if tag != "a" or attrs.get("href") != "#" or "hidden" not in attrs:
        return False, "Respondent link must remain hidden until validated configuration activates it"
    return True, "HTML activation contract valid"


def validate_public_files(directory):
    for path in directory.rglob("*"):
        if path.suffix not in {".html", ".js", ".css", ".json"} or path.name == "form-config.js":
            continue
        source = path.read_text(encoding="utf-8")
        for url in re.findall(r"https?://[^\s\"'<>`]+", source):
            if re.search(r"(?:docs|forms|drive)\.google\.com|forms\.gle", url, re.I):
                return False, "Google URLs must exist only in validated form-config.js: " + path.name
    return validate_page((directory / "index.html").read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--require-live", action="store_true")
    args = parser.parse_args()
    ok, message = validate(CONFIG.read_text(encoding="utf-8"), args.require_live)
    if ok:
        ok, message = validate_public_files(CONFIG.parent)
    print(("PASS" if ok else "FAIL") + ": " + message)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
