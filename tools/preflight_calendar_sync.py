#!/usr/bin/env python3
"""Read-only production Google Calendar connectivity and privacy preflight.

Designed for GitHub Actions on trusted main. Does not create a public JSON,
calendar write, reservation, upload, artifact, or verbose event log.
"""
import json
import os
import re
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sync_public_classes import (
    capacity_for_class,
    SECRETS,
    TZ,
    build,
    fetch_calendar,
    ROOT,
)


class PreflightFailure(Exception):
    """Safe, non-sensitive status code."""


def ensure_safe_projection(projection, events):
    if projection.get("dataState") != "ready" or projection.get("sourceMode") != "live":
        raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
    sessions = projection.get("sessions")
    if not isinstance(sessions, list):
        raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
    allowed = {
        "id", "classId", "className", "date", "start", "end", "classType",
        "level", "instructorId", "instructorName", "source", "publicStatus",
        "confirmedBookingCount", "bookingCountStatus", "bookingCountSource",
        "capacity", "updatedAt",
    }
    output = json.dumps(projection, ensure_ascii=False)
    identities = set()
    for session in sessions:
        if set(session) != allowed:
            raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
        if session["id"] in identities or not re.fullmatch(r"session-[a-f0-9]{24}", session["id"]):
            raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
        identities.add(session["id"])
        if session["capacity"] != capacity_for_class(session["className"]):
            raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
        if (session["confirmedBookingCount"] is not None
                or session["bookingCountStatus"] != "unknown"
                or session["bookingCountSource"] is not None
                or session["publicStatus"] not in ("OPEN", "CLOSE", "INQUIRY_ONLY")):
            raise PreflightFailure("SANITIZED_OUTPUT_INVALID")
    # Never allow calendar IDs, event IDs, raw descriptions, private notes,
    # locations, or attendee addresses to be embedded in the public output.
    # Comparisons remain in memory; do not log their values or individual events.
    for event in events:
        for field in ("id", "description", "location"):
            value = event.get(field)
            if isinstance(value, str) and len(value) >= 8 and value in output:
                raise PreflightFailure("PRIVATE_FIELD_LEAK")
        for attendee in event.get("attendees") or []:
            address = attendee.get("email") if isinstance(attendee, dict) else None
            if isinstance(address, str) and len(address) >= 8 and address in output:
                raise PreflightFailure("PRIVATE_FIELD_LEAK")


def main():
    if any(not os.environ.get(name) for name in SECRETS):
        raise PreflightFailure("MISSING_GITHUB_SECRETS")
    # Verify calendar access first, so credential connectivity can be
    # diagnosed even when an independently configured signing key is invalid.
    calendar_id = os.environ["RS_LESSON_CALENDAR_ID"]
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as GoogleAuthRequest
        info = json.loads(os.environ["RS_GOOGLE_SERVICE_ACCOUNT_JSON"])
        credentials = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/calendar.readonly"]
        )
    except Exception:
        raise PreflightFailure("INVALID_CREDENTIAL_JSON") from None
    try:
        credentials.refresh(GoogleAuthRequest())
    except Exception:
        raise PreflightFailure("GOOGLE_AUTH_FAILED") from None
    now = datetime.now(TZ)
    try:
        # The same 90-day horizon used by the normal publication pipeline.
        events = fetch_calendar(calendar_id, credentials.token,
                                now, now + timedelta(days=90))
    except Exception:
        raise PreflightFailure("CALENDAR_READ_FAILED") from None
    if not events:
        raise PreflightFailure("NO_CALENDAR_EVENTS")
    # Only use the HMAC key after private calendar authentication succeeded.
    key = os.environ["RS_SESSION_ID_KEY"].encode("utf-8")
    if len(key) < 32:
        raise PreflightFailure("INVALID_HMAC_KEY")
    try:
        catalog = json.loads((ROOT / "instructors/instructor-catalog.json").read_text(encoding="utf-8"))
        projection, supported = build(events, calendar_id, key, catalog, {}, now)
    except Exception:
        raise PreflightFailure("PARSER_OR_PROJECTION_FAILED") from None
    if supported != len(events):
        raise PreflightFailure("INCOMPLETE_CALENDAR_COVERAGE")
    ensure_safe_projection(projection, events)
    print("PREFLIGHT_OK: authenticated read, full calendar coverage, privacy and capacity checks.")
    print("COVERAGE: source_events=" + str(len(events)) + "; projected_events=" + str(supported))
    print("READ_ONLY: no JSON, calendar or booking data was written; no event content was logged.")


if __name__ == "__main__":
    try:
        main()
    except PreflightFailure as error:
        # No external exception text or raw private Calendar event data in public CI logs.
        print("PREFLIGHT_FAILED: " + str(error), file=sys.stderr)
        sys.exit(1)
