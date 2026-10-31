#!/usr/bin/env python3
"""Safe Google Calendar -> public class-session projection.

This job never changes Google Calendar or booking records. It fails closed until
both the calendar access and the owner's event-publication policy are configured.
Only a strict class/teacher/time allowlist is released; raw calendar text and IDs
must never appear in public JSON or CI output.
"""
import argparse
import hashlib
import hmac
import json
import os
import re
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from public_class_projection import project

ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Asia/Tokyo")
DURATIONS = {"STEP": 60, "TAP": 60, "STRETCH": 60, "ISOLATION": 60, "BAR METHOD": 30, "HIIT": 30}
CLASS_CAPACITIES = {"STEP": 10, "TAP": 10, "STRETCH": 5, "ISOLATION": 5, "BAR METHOD": 10, "HIIT": 10}
CLASS_IDS = {"STEP": "class-step", "TAP": "class-tap", "STRETCH": "class-stretch", "ISOLATION": "class-isolation", "BAR METHOD": "class-bar-method", "HIIT": "class-hiit"}
ALIASES = {"古庄": "furusho", "古庄里好": "furusho", "本間": "homma", "本間茂樹": "homma", "さささ": "sasasa",
           "MiFa": "mifa", "MiFa-san": "mifa", "丹生": "niu", "丹生良彬": "niu", "奥平": "okudaira", "奥平崇史": "okudaira"}
SECRETS = ("RS_GOOGLE_SERVICE_ACCOUNT_JSON", "RS_LESSON_CALENDAR_ID", "RS_SESSION_ID_KEY")


def instructors_from_catalog(catalog):
    return [dict(id=p["id"], name=p["name"], classes=p["classes"], line=p["contact"]["line"],
                 contactType=p["contact"]["type"], assignmentVerified=True)
            for p in catalog["instructors"]]


def identity(event, calendar_id, key):
    parent = event.get("recurringEventId") or event["id"]
    occurrence = (event.get("originalStartTime") or {}).get("dateTime", "") if event.get("recurringEventId") else ""
    value = "\x1f".join((calendar_id, parent, occurrence))
    return "session-" + hmac.new(key, value.encode("utf-8"), hashlib.sha256).hexdigest()[:24]


def normalize(event, calendar_id, key, approved, catalog):
    """No inferred class assignments or publication from event descriptions."""
    if event.get("status") != "confirmed" or event.get("visibility") == "private":
        return None
    parts = [p.strip() for p in re.split(r"[|｜]", event.get("summary", ""))]
    if len(parts) != 4 or parts[-1].upper() != "OPEN":
        return None
    raw_class, raw_teacher, raw_duration, _ = parts
    cls = re.sub(r"\s*🔰\s*", "", raw_class).strip().upper()
    cls = "BAR METHOD" if cls in ("BAR", "BAR METHOD") else cls
    if cls not in DURATIONS or not re.fullmatch(r"\d{2,3}\s*m", raw_duration, re.I):
        return None
    if int(re.match(r"\d+", raw_duration).group()) != DURATIONS[cls]:
        return None
    teacher_id = ALIASES.get(raw_teacher)
    teacher = approved.get(teacher_id)
    if not teacher or cls not in teacher.get("classes", []):
        return None
    # An OPEN marker is only treated as approval after the owner enables
    # RS_OPEN_CLASSES_APPROVED and reviews these exact mappings.
    start = (event.get("start") or {}).get("dateTime")
    end = (event.get("end") or {}).get("dateTime")
    if not start or not end or not event.get("id"):
        return None
    try:
        a = datetime.fromisoformat(start.replace("Z", "+00:00")).astimezone(TZ)
        b = datetime.fromisoformat(end.replace("Z", "+00:00")).astimezone(TZ)
    except ValueError:
        return None
    if a.date() != b.date() or (b-a).total_seconds() != DURATIONS[cls] * 60:
        return None
    session_id = identity(event, calendar_id, key)
    level = "超初級" if "🔰" in raw_class else ("初級" if "初級" in raw_class else "")
    return dict(publicApproved=True, kind="lesson", summary="OPEN", calendarKey="approved",
                eventKey=session_id, originalStart="approved", instructorId=teacher_id,
                classId=CLASS_IDS[cls], className=cls + (" " + level if level else ""),
                classType=cls, publicLevel=level, start=a.isoformat(), end=b.isoformat(),
                approvedCapacity=CLASS_CAPACITIES[cls], cancelled=False), session_id


def fetch_calendar(calendar_id, access_token, start, end):
    rows, page = [], None
    while True:
        params = dict(singleEvents="true", showDeleted="false", maxResults=2500,
                      timeMin=start.isoformat(), timeMax=end.isoformat(),
                      orderBy="startTime", timeZone="Asia/Tokyo")
        if page:
            params["pageToken"] = page
        url = "https://www.googleapis.com/calendar/v3/calendars/" + quote(calendar_id, safe="") + "/events?" + urlencode(params)
        with urlopen(Request(url, headers={"Authorization": "Bearer " + access_token}), timeout=40) as response:
            payload = json.load(response)
        if not isinstance(payload.get("items"), list):
            raise RuntimeError("Invalid Calendar API response")
        rows.extend(payload["items"])
        page = payload.get("nextPageToken")
        if not page:
            return rows


def build(events, calendar_id, key, catalog, previous, now):
    people = instructors_from_catalog(catalog)
    by_id = {p["id"]: p for p in people}
    normalized, id_map = [], {}
    for event in events:
        value = normalize(event, calendar_id, key, by_id, catalog)
        if value is None:
            continue
        item, public_id = value
        ident = ("approved", public_id, "approved")
        if ident in id_map:
            raise RuntimeError("Duplicate approved session identity")
        normalized.append(item)
        id_map[ident] = public_id
    stamp = now.isoformat(timespec="seconds")
    public = project(normalized, people, id_map, stamp)
    # Full scans remove deleted sessions; retain future cancellation tombstones,
    # without exposing the underlying calendar identifiers.
    today = now.date().isoformat()
    start, end = today, (now + timedelta(days=90)).date().isoformat()
    current = {s["id"] for s in public["sessions"]}
    if previous.get("dataState") == "ready":
        for old in previous.get("sessions", []):
            if start <= old.get("date", "") <= end and old.get("id") not in current and old.get("source") == "live":
                tomb = {k: old[k] for k in (
                    "id", "classId", "className", "date", "start", "end", "classType",
                    "level", "instructorId", "instructorName", "source", "capacity")}
                tomb.update(publicStatus="CANCELLED", confirmedBookingCount=None,
                            bookingCountStatus="unknown", bookingCountSource=None, updatedAt=stamp)
                public["sessions"].append(tomb)
    public["sessions"].sort(key=lambda s: (s["date"], s["start"], s["id"]))
    return public, len(normalized)


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "data/class-sessions.public.json"))
    args = parser.parse_args()
    if os.environ.get("RS_OPEN_CLASSES_APPROVED") != "true":
        raise SystemExit("Calendar publication approval is not enabled")
    missing = [name for name in SECRETS if not os.environ.get(name)]
    if missing:
        raise SystemExit("Missing protected calendar configuration: " + ", ".join(missing))
    session_key = os.environ["RS_SESSION_ID_KEY"].encode()
    if len(session_key) < 32:
        raise SystemExit("Session ID HMAC key must be at least 32 bytes")
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as AuthRequest
    except ImportError as exc:
        raise SystemExit("Install google-auth: " + str(exc))
    info = json.loads(os.environ["RS_GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/calendar.readonly"])
    creds.refresh(AuthRequest())
    now = datetime.now(TZ)
    calendar_id = os.environ["RS_LESSON_CALENDAR_ID"]
    rows = fetch_calendar(calendar_id, creds.token, now, now + timedelta(days=90))
    target = Path(args.output)
    old = json.loads(target.read_text()) if target.exists() else {}
    catalog = json.loads((ROOT / "instructors/instructor-catalog.json").read_text())
    result, accepted = build(rows, calendar_id, session_key, catalog, old, now)
    # Refuse an anomalous complete data loss; never replace successful data with empty
    # on a potentially misconfigured or expired credential/calendar.
    if old.get("sessions") and not accepted:
        raise SystemExit("Zero approved sessions after previously populated data; refusing overwrite")
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=target.parent, encoding="utf-8", delete=False) as temp:
        json.dump(result, temp, ensure_ascii=False, indent=2)
        temp.write("\n")
        temp_path = temp.name
    os.replace(temp_path, target)
    print("Public class synchronization succeeded; approved entries:", accepted)


if __name__ == "__main__":
    run()
