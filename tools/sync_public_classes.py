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
DURATIONS = {"STEP": (60,), "TAP": (60, 90), "STRETCH": (30, 60), "ISOLATION": (60,), "BAR METHOD": (30,), "HIIT": (30,)}
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


def capacity_for_class(raw_class):
    """Owner-approved studio rule: Stretch/Isolation 5, other lessons 10."""
    name = raw_class.strip().upper()
    if name.startswith("STRETCH") or name.startswith("ISOLATION"):
        return 5
    return 10


def normalize(event, calendar_id, key, approved, catalog):
    """The lesson calendar is an owner-approved publication source.

    Every active, timed lesson is represented. Never discard a valid event
    because a class label, duration or teacher is absent from our fixed catalog.
    Raw descriptions, attendees, Google IDs and notes are never projected.
    """
    if event.get("status") == "cancelled":
        raise ValueError("Unexpected cancelled event in active scan")
    if event.get("status") not in (None, "confirmed"):
        raise ValueError("Non-confirmed lesson calendar event")
    if event.get("visibility") == "private":
        raise ValueError("Private-visibility event found in approved lesson calendar")
    title = event.get("summary")
    if not isinstance(title, str) or not title.strip() or len(title) > 180:
        raise ValueError("Invalid calendar lesson title")
    # Prevent accidental personal contact leakage if the calendar title
    # convention changes later; stop the entire sync, never skip one row.
    if re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?://", title, re.I):
        raise ValueError("Contact address in lesson title")
    # Explicit owner rule: ONLY a standalone final CLOSE means no
    # additional riders. All other active lessons default to OPEN, whether
    # they have an OPEN marker, a different suffix, or no marker at all.
    admission_status = "CLOSE" if re.search(r"(?:^|[|｜\s])CLOSE\s*$", title, re.I) else "OPEN"
    parts = [p.strip() for p in re.split(r"[|｜]", title)]
    # Existing title orders have 4 fields with a status marker, but 3-field
    # titles without any marker must also retain their class and teacher.
    # For unrecognized titles, keep the complete calendar title as the label.
    core = parts[:-1] if len(parts) == 4 and re.fullmatch(r"OPEN|CLOSE", parts[-1], re.I) else parts
    duration_one = re.fullmatch(r"(\d{2,3})\s*m", core[1], re.I) if len(core) == 3 else None
    duration_two = re.fullmatch(r"(\d{2,3})\s*m", core[2], re.I) if len(core) == 3 else None
    parsed = len(core) == 3 and bool(duration_one) != bool(duration_two)
    if parsed:
        raw_class = core[0]
        raw_teacher = core[2] if duration_one else core[1]
    else:
        raw_class = title.strip()
        raw_teacher = "スタジオに確認"
    if not raw_class or not raw_teacher:
        raise ValueError("Incomplete lesson calendar title")
    start = (event.get("start") or {}).get("dateTime")
    end = (event.get("end") or {}).get("dateTime")
    if not start or not end or not event.get("id"):
        raise ValueError("Missing required timed lesson metadata")
    try:
        a = datetime.fromisoformat(start.replace("Z", "+00:00")).astimezone(TZ)
        b = datetime.fromisoformat(end.replace("Z", "+00:00")).astimezone(TZ)
    except ValueError:
        raise ValueError("Invalid timed lesson metadata") from None
    if a.date() != b.date() or b <= a:
        raise ValueError("Invalid same-day lesson duration")
    cls = raw_class.replace("🔰", "").strip().upper()
    if cls == "BAR":
        cls = "BAR METHOD"
    # Preserve nonstandard legitimate class labels (e.g. STEP & 振付,
    # TAP初級, STEP🟡) instead of silently dropping them.
    class_type = cls if cls in CLASS_IDS and cls == raw_class.strip().upper() else (
        "STEP" if cls == "STEP" else raw_class
    )
    level = "超初級" if "🔰" in raw_class else ""
    class_name = ("STEP 超初級" if class_type == "STEP" and level else raw_class)
    class_id = CLASS_IDS.get(class_type) or "class-calendar-" + hmac.new(
        key, ("class:" + class_type).encode("utf-8"), hashlib.sha256
    ).hexdigest()[:16]
    session_id = identity(event, calendar_id, key)
    teacher_id = ALIASES.get(raw_teacher)
    if teacher_id not in approved:
        teacher_id = "calendar-teacher-" + hmac.new(
            key, ("teacher:" + raw_teacher).encode("utf-8"), hashlib.sha256
        ).hexdigest()[:16]
    teacher = {"id": teacher_id, "name": approved[teacher_id]["name"] if teacher_id in approved else raw_teacher}
    value = dict(publicApproved=True, kind="lesson", summary=admission_status,
                 admissionStatus=admission_status,
                 calendarKey="approved", eventKey=session_id, originalStart="approved",
                 instructorId=teacher_id, classId=class_id, className=class_name,
                 classType=class_type, publicLevel=level,
                 start=a.isoformat(), end=b.isoformat(),
                 approvedCapacity=capacity_for_class(raw_class), cancelled=False)
    return value, session_id, teacher



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
        item, public_id, teacher = normalize(event, calendar_id, key, by_id, catalog)
        person = by_id.get(teacher["id"])
        if person is None:
            person = dict(id=teacher["id"], name=teacher["name"], classes=[],
                          line="https://lin.ee/zC5YLe7",
                          contactType="studio_official", assignmentVerified=False)
            by_id[person["id"]] = person
            people.append(person)
        # An actual entry in the studio-owned lesson calendar overrides
        # the catalog's static class assignment list for that occurrence.
        if item["classType"] not in person["classes"]:
            person["classes"].append(item["classType"])
        ident = ("approved", public_id, "approved")
        if ident in id_map:
            raise RuntimeError("Duplicate lesson session identity")
        normalized.append(item)
        id_map[ident] = public_id
    stamp = now.isoformat(timespec="seconds")
    public = project(normalized, people, id_map, stamp)
    # The browser has a static official instructor catalog. Include only
    # additional calendar-listed guest and co-teacher display identities.
    public["instructors"] = [
        dict(id=p["id"], name=p["name"], classes=p["classes"],
             line="https://lin.ee/zC5YLe7", contactType="studio_official",
             assignmentVerified=False)
        for p in people if p["id"].startswith("calendar-teacher-")
    ]
    if len(public["sessions"]) != len(events):
        raise RuntimeError("Calendar projection incomplete: refusing partial publication")
    # Previously published sessions removed from the active calendar are
    # retained as clearly marked cancellation records, never as open classes.
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
    if accepted != len(rows):
        raise SystemExit("Partial projection is forbidden for the lesson calendar")
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
    print("Public lesson synchronization succeeded; active calendar entries projected:", accepted)


if __name__ == "__main__":
    run()
