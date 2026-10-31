# Rhythm Speaker 通常クラス｜Google Calendar 自動同期

Status: **IMPLEMENTED AS A GATED PR; NOT LIVE until the owner configures access/publication**.

## Architecture

- Source: studio-owned **レッスン296** Google Calendar, read-only service-account access.
- Runtime: GitHub Actions, hourly schedule, only after explicit repository-variable approval.
- Output: \`data/class-sessions.public.json\`, the existing GitHub Pages UI's data source.
- No direct browser access to private Google Calendar; no calendar editing or booking writes.
- 「296レンタル」 is **not** published and is not used as a free/busy guarantee.
- Existing \`tools/public_class_projection.py\` defines the public allowlist.
- Stable public IDs use HMAC-SHA256 with a private signing key, no Google IDs in JSON.
- Public fields: approved class/date/time/teacher, explicitly approved capacity,
  \`bookingCountStatus: unknown\`, and no raw title/description/attendees.
- A full scan of the next 90 days handles recurrence and removals; removed future
  entries are marked \`CANCELLED\`, except that unexpected total loss fails closed.
- If public synchronization has not succeeded for three hours, the browser hides
  stale sessions and routes visitors to official LINE/email.

## Required one-time owner/operator setup (never provide credentials in chat)

1. In Google Cloud, configure a service account with read-only Calendar API access;
   share only the **レッスン296** calendar with its service account identity at
   the minimum available read permission. Do not share private personal calendars.
   The service account should not need calendar-edit or broad Google Workspace access.
2. Add GitHub **Actions secrets** to \`noritap/rhythmspeaker\`:
   - \`RS_GOOGLE_SERVICE_ACCOUNT_JSON\`: service account JSON stored only in GitHub secret,
     never in a PR, source file or chat.
   - \`RS_LESSON_CALENDAR_ID\`: calendar ID for レッスン296, also a secret.
   - \`RS_SESSION_ID_KEY\`: random secret key of at least 32 UTF-8 bytes; keep stable
     across runs or public session links will change.
3. Owner must review and approve **publication policy** for existing event titles:
   only \`<CLASS> | <APPROVED_TEACHER> | <DURATION>m | OPEN\` is eligible,
   and only when the class/teacher pairing matches the six approved instructors
   in \`instructors/instructor-catalog.json\`. A Google "confirmed" status or
   an OPEN marker alone does not grant public access before owner approval.
   Review whether this convention applies to **all** future eligible events.
   Private visibility, CLOSE/REOPEN, unknown classes/teachers and bad durations
   always remain excluded.
4. Verify the **actual approved maximum class capacity** and configure GitHub
   **Actions variable** \`RS_APPROVED_CLASS_CAPACITY\` as an integer. Do not assume
   the prototype's 10-person sample capacity applies to real classes. If capacity
   differs by class/session, update the policy and tests before enabling sync.
5. Only after the above review and a successful private preview, set repository
   **Actions variables**:
   - \`RS_OPEN_CLASSES_APPROVED=true\`
   - \`RS_CALENDAR_SYNC_ENABLED=true\`
6. In GitHub Actions, run the workflow manually once and review the generated
   sanitized JSON diff and the public schedule page. Scheduled runs are hourly
   at minute 17. The workflow commits only \`class-sessions.public.json\`.
7. Test recurrence/cancellation, class/teacher mapping, private event exclusion,
   stale-data handling, LINE handoff, responsive views and error recovery.

## Safety and remaining boundaries

- Never paste the service account private key or calendar ID into a page's JavaScript.
- GitHub Pages cannot authenticate privately to Google Calendar on its own.
- Secrets/Actions Variables management and Google Cloud calendar sharing require
  the owner's authorized configuration; merely merging this PR does not enable sync.
- No confirmed reservation counts exist: do not display "0 booked", "seats available",
  or "full" without a verified **separate** reservations ledger.
- No automatic booking, payments, calendar edits, or RSVP messages exist.
- The branch protects the current production page until credentials, publication
  classification and capacity are verified. Incomplete setup must not be
  described as a completed production connection.
- Use \`python tools/test_sync_public_classes.py\` and
  \`python tools/test_public_class_projection.py\` for offline contracts.

## Rollback

Set \`RS_CALENDAR_SYNC_ENABLED=false\`. For a confirmed incident, restore the
last approved public JSON to an \`unavailable\` envelope and issue a normal
GitHub Pages deployment; never substitute sample events into production.
