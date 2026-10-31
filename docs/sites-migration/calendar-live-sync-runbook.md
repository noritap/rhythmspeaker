# Rhythm Speaker 通常クラス｜Google Calendar 自動同期

Status: **Owner approved the entire レッスン296 calendar as publishable lesson schedules (2026-11-01). Sync remains gated by GitHub variables until validation and activation.**

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

## Read-only verification before public release

- Workflow: .github/workflows/class-calendar-preflight.yml (Calendar connectivity and privacy preflight).
- Runs on trusted main pushes to preflight-related files or by manual Actions dispatch.
- Pull requests execute offline contract tests, never using production secrets.
- Validates credential authentication, private lesson-calendar read, allowlisted class projection,
  per-class capacity, unknown booking counts and private field exclusion.
- Never writes data/class-sessions.public.json, Google events, bookings, uploads or artifacts.
- Only sanitized PASS and error category codes are printed; no raw events, IDs, attendees or keys.
- Both repository publication variables remain false until the all-events coverage release is tested. The owner has already approved publication of this calendar.

### Source calendar findings and coverage contract

- On 2026-11-01, Nov 1–30 contained 117 active timed events:
  93 matched the former whitelist and 24 were wrongly excluded.
- Observed special labels include TAP初級, STEP & 振付, STEP🟡, TAP応用🔵, BAR メソッド.
- Guest instructors and combinations such as かっつん, 古庄里好・丹生,
  古庄/MiFa-san and 古庄里好・MiFa-san are represented as published display identities.
- Source count MUST equal projected event count on each run; any drop fails the workflow.
- `OPEN` denotes calendar's own marker only, not confirmed available seats or a booking.
- Per-class capacity remains STRETCH/ISOLATION 5, otherwise 10.
- No reservation ledger exists; booking counts remain unknown.
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
3. Owner-approved publication scope (2026-11-01): Every active, timed event
   in the studio-owned レッスン296 calendar is a publishable studio lesson.
   Do not require an OPEN marker, a teacher/class allowlist match, or a standard
   class label. Both title orders and guest/co-teacher names are supported.
   An unknown class label or teacher is preserved, never silently dropped.
   The job fails closed on invalid/private event metadata or incomplete projection.
   No attendee information, raw Google IDs, descriptions, locations or private
   notes are published. Event title class and teacher portions are publishable.
   The existing rolling 90-day upcoming-schedule horizon is retained.
   This is the published schedule window, not a historical archive of the calendar.
4. **Approved class capacities (2026-11-01, owner-confirmed):**
   - STRETCH: 5 attendees
   - ISOLATION: 5 attendees
   - STEP, TAP, BAR METHOD, HIIT: 10 attendees each
   These values are stored in the per-class mapping
   `tools/sync_public_classes.py` (`CLASS_CAPACITIES`) and covered by tests.
   The previous `RS_APPROVED_CLASS_CAPACITY` GitHub variable is no longer used.
   A future capacity change requires a code and test update.
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
