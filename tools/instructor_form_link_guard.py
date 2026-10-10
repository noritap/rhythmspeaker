#!/usr/bin/env python3
"""Static launch gate for Google Forms respondent links; stdlib only."""
import argparse
import pathlib
import re
import sys
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "instructor-submit" / "form-config.js"
PATTERN = re.compile(r"^\s*window\.RS_INSTRUCTOR_FORM_URL\s*=\s*(['\"])(.*?)\1\s*;\s*$", re.M)


def validate(source: str, require_live: bool = False):
    matches = PATTERN.findall(source)
    if len(matches) != 1:
        return False, "Expected exactly one literal RS_INSTRUCTOR_FORM_URL assignment"
    url = matches[0][1]
    if not url:
        return (False, "Form URL not configured") if require_live else (True, "Safe inactive state")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in {"docs.google.com", "forms.gle"}:
        return False, "Only HTTPS Google Forms respondent links are permitted"
    if parsed.username or parsed.password or parsed.fragment:
        return False, "Credentials and fragments are not allowed"
    if parsed.hostname == "docs.google.com" and not re.fullmatch(r"/forms/d/(?:e/)?[A-Za-z0-9_-]+/viewform/?", parsed.path):
        return False, "Use a Google Forms respondent viewform URL, not an edit URL"
    if parsed.hostname == "forms.gle" and not re.fullmatch(r"/[A-Za-z0-9_-]+/?", parsed.path):
        return False, "Invalid forms.gle short link"
    return True, "Respondent URL syntax valid; live response acceptance requires manual QA"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--require-live", action="store_true")
    args = parser.parse_args()
    ok, message = validate(CONFIG.read_text(encoding="utf-8"), args.require_live)
    print(("PASS" if ok else "FAIL") + ": " + message)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
