# Rhythm Speaker 通常クラス｜Google Calendar 自動同期

Status: **Owner approved the entire レッスン296 calendar as publishable lesson schedules (2026-11-01). Sync remains gated by GitHub variables until validation and activation.**

## Architecture

- Source: studio-owned **レッスン296** Google Calendar, read-only service-account access.
- Runtime: GitHub Actions with two scheduled opportunities per hour, only after explicit repository-variable approval.
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

## Customer-facing booking certainty and no-cost refresh (2026-11-01)

- Every published active lesson in レッスン296 is a **confirmed class that will be held**, not a tentative class. Publication and the customer's seat reservation are different facts.
- **A customer's attendance reservation is confirmed only when the studio explicitly replies 「予約確定」 by LINE message or email.** An inquiry, a copy button, opening LINE, or even sending a message does not constitute booking confirmation.
- `CLOSE` at the end of a calendar event title means the confirmed class accepts **no further joining students**, but remains public. `OPEN` or no marker means new joining inquiries are accepted, without guaranteeing a seat.
- The visitor-visible `開催情報を再読み込み` button only re-fetches `data/class-sessions.public.json` from **GitHub Pages** with a cache-busting request. It does not contact Google Calendar, trigger GitHub Actions, mutate classes, or incur extra paid back-end operations.
- Google Calendar to GitHub data publication remains separate via the approved GitHub Actions job (cron: `17,47 * * * *`, two opportunities per hour). Calendar changes become visible **after successful scheduled sync and Pages deployment**; the user-side refresh only picks up the latest already-published snapshot.
- For immediate Google Calendar-to-site sync, an authenticated operator may manually dispatch the existing workflow on `main`. Never expose GitHub tokens or Calendar credentials to public browser code, nor allow any visitor to trigger a backend sync.
- When refreshing fails, the UI preserves the last validated data and shows an error. After 3h without successful source sync, the existing stale-data guard still hides outdated class availability.

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
- **Final owner rule (2026-11-01):** Only a standalone `CLOSE` token at the **end** of the calendar event title (case-insensitive, optional trailing whitespace) disables extra riders. Example: `STEP🔰 | 60m | 本間 | CLOSE`.
- `OPEN`, no marker, and any **non-CLOSE** trailing marker are all treated as `OPEN` for rideshare inquiries. No `OPEN` suffix is required. If 3-part class/teacher/duration titles have no marker, both known column orders remain parsed. Unrecognized title formats stay visible as full class labels.
- `CLOSE` means the lesson remains **publicly listed and scheduled** but has `追加受付なし`; it is not cancelled or automatically marked full.
- `OPEN` allows only an **application/inquiry**, never an automatically confirmed seat. The studio confirms after inquiry; actual booking counts remain unknown.
- **Operational risk of default-allow:** Forgetting to set `CLOSE` allows applications on a class that should be closed. Operators must explicitly add final `CLOSE` whenever additional attendees are not accepted, and confirm updates on the site after each calendar change. If that mistake is unacceptable, a fail-closed explicit status scheme should be used instead.
- The UI must never show `CLOSE` as `満席`, `開講中止`, or `このクラスに参加する`.
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

## VC1 publication reliability (2026-11-02; Draft PR until merged)

- GitHub Actions attempts scheduling at minutes 17 and 47 each hour. This reduces the expected wait but is **not a guaranteed timer**: GitHub may delay or omit scheduled events.
- The `publish` job retains its `main`-only, explicit approval-variable gate, write permission scoped to that job, and `publish-public-classes` concurrency group. No production calendar credentials are used by PR test jobs.
- `tools/publish_public_classes.sh` commits only `data/class-sessions.public.json` and uses a normal, **non-force** push.
- On a push rejection, it fetches the newest `main`. A retry is allowed only when the remote history is a descendant of the original checkout and the public JSON itself has **not changed** remotely. Unrelated concurrent commits are rebased; changed public JSON, rewrite, or unchanged remote head fail closed.
- The publish step has a maximum of three attempts. A failed job must remain visibly failed for investigation; never silently mark a skipped or conflicted publication as successful.
- Offline regression tests run via `python tools/test_calendar_workflow_reliability.py`, using disposable local Git repos to test normal publish, no-op, unrelated remote commit, conflicting public JSON, and non-main ref safety.
- No automatic outside watchdog, alerting, or user-facing stale-UI redesign is included in VC1. Those remain future independent changes.
- After merging and explicitly approving release, inspect the next scheduled Actions runs and GitHub Pages' published `lastSuccessfulSyncAt`. A merge alone does not guarantee that a scheduled run will occur.

## Rollback

Set \`RS_CALENDAR_SYNC_ENABLED=false\`. For a confirmed incident, restore the
last approved public JSON to an \`unavailable\` envelope and issue a normal
GitHub Pages deployment; never substitute sample events into production.
