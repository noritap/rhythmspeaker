# RHYTHM SPEAKER｜WEB OPERATIONS MVP v1.0 — Scope, Gates and Acceptance

- Baseline: 2026-11-02 JST; proposal until the roadmap PR is reviewed/merged.
- Repository: `noritap/rhythmspeaker` / `main` / GitHub Pages.
- **Single progress tracker:** [Issue #328](https://github.com/noritap/rhythmspeaker/issues/328).
- **This document:** scope, order, dependencies, acceptance criteria, non-goals; not a new source for business facts, UX copy, navigation, or class statuses.
- Canonical authority remains `PROJECT_PROFILE.md` (identity/security), `docs/ux/RS_WEB_UX_RULES_V2.md` (booking and UX), `docs/03_NAVIGATION_REGISTRY.md` (menu), `docs/seo/page-registry.json` (URL/index policy), `docs/seo/SEO_AND_MEASUREMENT_ROADMAP.md` (GSC/GA4 roll-out), `docs/04_TRIAL_CONVERSION_OPERATING_RUNBOOK.md` (trial funnel), and `noritap/AI_OS_CREATION_RULES` (general development).
- **MVP is operational quality, not a redesign.** No unbounded feature additions.

## 1. What "一旦の完成" means

A visitor can:
1. Open the official site and find the first-trial information and application without dead links.
2. Find up-to-date class schedules, or see a safe alternative consultation path when current availability cannot be verified.
3. Navigate P0 and P1 pages on smartphones (320/375/390/430px) and desktop, with no blockers.
4. Consult the studio; the interface does not claim that opening/sending LINE constitutes booking confirmation.

The operator can:
1. Detect failed/stale synchronization and important P0 failures automatically, distinguish failure modes, and start documented recovery without editing the calendar manually.
2. Prove production publication using CI + live URL checks, not code-only assertions.
3. Read a basic page-level report of search/page views, trial-intent CTA and aggregated inquiries/bookings/visits, with unavailable values explicitly marked **unmeasured** (not zero).

**MVP acceptance requires all G0–G5 gates and a 7-day observation window.** A 30-day optimization outcome is post-MVP work, not a blocker for v1.0. This document does not promise zero external infrastructure downtime or search ranking gains.

## 2. Verified baseline / evidence versus gaps

| Item | Evidence | State |
|---|---|---|
| Public site | `/`, `/trial/`, `/trial/apply/`, `/schedule/` | LIVE; per-breakpoint runtime sweep outstanding |
| Page/index inventory | 53 HTML: 43 public sitemap URLs, 9 noindex, 1 dynamic `workshops/event.html?slug=...` | DONE via merged PR #326 |
| SEO metadata/CI | `tools/sitemap_audit.py`, `.github/workflows/sitemap-audit.yml` | DONE in main; Search Console verification outstanding |
| Trial application | Customer-reported smartphone operation incl. LINE/email/copy | PASS by user; **do not rewrite** without evidence of regression |
| Calendar sync | `.github/workflows/class-calendar-sync.yml` currently `17 * * * *` | LIVE but missed schedule windows observed |
| Calendar hardening | PR #325 (dual cron, safe non-force publication + offline regression) | DRAFT / UNMERGED; revalidate against latest main |
| Independent heartbeat/recovery | Cloudflare or other independent scheduler | NOT IMPLEMENTED |
| Analytics | Existing Draft PR #274 carries proposed GA4 script and an unverified measurement identifier | DRAFT / UNMERGED; **do not merge without owner ID/privacy confirmation** |
| Trial reporting | Existing CSV and `tools/trial_conversion_report.py` | SCHEMA READY / NO MEASUREMENTS |
| Current metric action | [Issue #327](https://github.com/noritap/rhythmspeaker/issues/327) | OPEN |
| Project profile drift | Attached Project Sources v3.4 describes Workshop demo; main v3.5 specifies live Supabase | DRIFT noted; main overrides stale attachment |

Verify these against current `main` and current PRs before **each** implementation action; do not repeat stale assertions as current status.

## 3. Fixed stage gates (sequential production rollout)

### G0 — Decide scope / project baseline

**Deliverable:** this roadmap reviewed, central progress Issue #328, approved operational definition and P0/P1 routes.

**Exit gate:**
- [ ] Roadmap reviewed; one current gate in Issue #328 (no parallel stage declared DONE).
- [x] Verified page/index inventory and existing active PRs.
- [ ] Project Sources/Profile drift acknowledged; AI reads current `main` as operational authority.
- [ ] For each in-scope improvement: owner, source, data boundary, and test evidence documented.

**Stage scope:** docs and read-only audit only. No production configuration changes needed to adopt a roadmap.

### G1 — Schedule and conversion availability first (P0)

**Deliverable:** safer calendar sync + independent stale detection/recovery and a trustworthy user fallback.

**Work, in order:**
1. Review/rebase/refresh [PR #325](https://github.com/noritap/rhythmspeaker/pull/325) against latest main; verify existing tests, exact data contracts, job permissions, Google read-only credentials, and publication concurrency. Integrate only when approved and CI + production check passes.
2. Build a **separate** independent watchdog (provider chosen only after account/permissions approval) reading public JSON and GitHub run/deployment state. Suggested checks every 15 minutes, stale-warning at 90 minutes, urgent at the existing 3-hour UI cutoff. Trigger `workflow_dispatch` only after preventing duplicate, runaway, or already-running jobs. Record recovery result and notify on failure.
3. Under a separate PR, verify or improve stale-data fallback: never present an unverified old `OPEN` as live bookability; offer LINE consultation; do not silently show an empty calendar as if no classes exist.
4. Run **non-destructive** offline/dry-run failures: missed cron, missing JSON, newer concurrent data, expired token, delayed Pages publication, failed recovery dispatch. Public production booking data must not be edited.

**Exit gate:**
- [ ] Calendar hardening safely deployed and a real scheduled publication run verified.
- [ ] Independent watchdog live with accountable notification channel, credentials protected, duplicate controls tested.
- [ ] Stale-data user-facing fallback and original OPEN/CLOSE/CANCELLED rules verified.
- [ ] Operator runbook includes a manual recovery route and no new P0 regression.

**If external monitoring provider not yet connected:** G1 is **BLOCKED**, not DONE. Design/read-only development of later gates may proceed, but no later production roll-out is declared complete.

### G2 — Sitewide monitoring with page-based policy

**Deliverable:** P0 runtime monitoring, 43 public routes inventory-based daily check, P1 navigation and smartphone QA.

**Coverage:**
- **P0 (minimum):** `/`, `/trial/`, `/trial/apply/`, `/schedule/`. Check page/network response, missing assets, JS errors, primary CTA handoff, schedule data freshness and date/class selection.
- **P1:** `/pricing/`, `/classes/`, `/instructors/`, `/access/`, `/faq/`, `/ecosystem/`, `/workshops/`, plus applicable `/rental/` and `/classes/step/`. Check core links, accurate business facts, canonical nav, non-broken images.
- **All public 43:** canonical/sitemap/HTTP and internal link audit at least daily; update the registry when a page appears or is removed.
- **Dynamic WS event:** use a known non-sensitive `?slug=` for display-only checks; do not submit real reservations to probe production.
- **S surfaces:** protected `/workshops/admin/`, `/workshops/instructor/`, `/workshops/instructor/edit.html` assessed with access-safe tests; **do not put tokens or student records in monitoring output**.
- **P2/P3:** weekly/monthly coverage as appropriate, separate from mandatory P0 uptime.

**Suggested intervals (targets, not existing capabilities):** P0 15–30 minutes; public 43 route audit daily; P1 functional QA on significant changes; P2 weekly; P3 monthly; security checks on affected changes.

**Exit gate:**
- [ ] A reproducible CI/browser QA suite covers P0 at 320/375/390/430/768/1440px including no horizontal overflow and blocked clicks.
- [ ] 43 public URLs have auditable route/HTTP/image/link results; any exceptions include owner and risk.
- [ ] One notification/recovery runbook exists; monitoring is not dependent on an open personal laptop.
- [ ] Runtime failures are reported as failures, not hidden by passing unit tests.

### G3 — Public SEO verify and Search Console

**Deliverable:** source/production parity and owner-verified GSC.

**Exit gate:**
- [ ] Compare live `sitemap.xml` (43 URLs) with latest main, robots, canonical, noindex and user-facing URLs.
- [ ] Confirm live HTTP behavior for representative public and excluded routes; Search Console indexing may take longer and is **not guaranteed**.
- [ ] Verify the operator's exact GSC property and submit the sitemap. Record sitemap processing / indexing state, not a promise of ranking.
- [ ] Maintain `noindex` vs real auth: noindex never counts as restricting access.

**External account authorization required** for GSC property verification/submission.

### G4 — Analytics and operator outcome measurement

**Deliverable:** verified page views and trial-specific CTA events, plus genuine aggregate inquiry/booking/visit counts.

**Work, in order:**
1. Inspect existing [PR #274](https://github.com/noritap/rhythmspeaker/pull/274) rather than generating a second tracker. Its measurement ID and click-event logic are **not verified** merely because they are present in Draft code; rework for latest main.
2. Verify operator-owned GA4 property/stream; complete privacy/cookie/consent review and obtain explicit authorization before installing/activating tracking.
3. Instrument P0/P1 page views and **trial-specific** `line_cta_click`; separate LINE general consultation, workshop, email handoff and form copy. No PII, form fields, names, messages, preferred date or class choice in analytics event payload.
4. Verify GA4 Realtime/DebugView under actual navigation; ensure events fire once and links still work.
5. Use only the existing `data/trial_conversion_baseline.csv` plus `tools/trial_conversion_report.py`. Aggregate inquiry, explicit studio `予約確定`, actual visits. When page attribution is unknown, label it unknown; avoid duplication of student/booking ledgers.

**Exit gate:**
- [ ] Correct owner-confirmed measurement ID, privacy gate signed off, and no unauthorized data transfer.
- [ ] Page view + CTA/handoff events verified via Debug/Realtime.
- [ ] Aggregate counts for 7 observed days can be reported; uninstrumented stages say `NOT MEASURED`, not `0`.
- [ ] Reporting distinguishes LINE click, inbound inquiry, booking confirmation, and attended trial.

**External account/consent authorization required** before live tracking.

### G5 — MVP production acceptance and handoff

**Deliverable:** acceptance evidence and a repeatable operator dashboard/report.

**Exit gate (all mandatory):**
- [ ] No unresolved P0 regression or privacy/auth blocker; high-risk changes received review.
- [ ] P0 and G1 watchdog have **7 consecutive days** of timestamped operational observations; any outages documented and resolved/re-verified, not erased.
- [ ] P0 4-page functional tasks pass on target mobile widths; S surfaces have access-safe checks without production writes.
- [ ] Source audit CI and sitewide policy CI pass on the released commit; GitHub Pages deploy succeeds and production URLs are checked directly.
- [ ] GSC sitemap processing/diagnostics and GA4 event verification recorded.
- [ ] 7-day aggregate funnel report exists with source labels and unknown values preserved.
- [ ] A non-developer operator can find: last sync, monitoring/alert state, latest report, incident recovery, PR rollback reference, next owner action.
- [ ] Owner records explicit `WEB OPERATIONS MVP v1.0: ACCEPTED` in Issue #328 after reviewing evidence.

**30-day trend improvement is a post-MVP evaluation**, not a gate to ship v1.0.

## 4. Work-loop rule (prevents unplanned detours)

For every cycle:
```
MAIN + Project Profile + latest PR/Issue
  -> Identify CURRENT GATE in Issue #328
  -> P0 safety/production incident? If yes, stop and log emergency exception
  -> Select at most 3 value cycles (3VC) wholly inside current gate
  -> Record before coding: evidence, owner, files, data/safety boundary, QA, rollback
  -> Implement via scoped branch and PR (no silent broad edits)
  -> CI + browser/production verification as relevant
  -> Update Issue #328: gate status, evidence URLs, next single action
  -> Move to next gate ONLY after explicit exit criteria PASS
```

- **Only one CURRENT GATE.** Later gate tasks may be researched, but not silently deployed as 'completed' out of sequence.
- Outside-scope suggestions go to `v1.1 BACKLOG`. Do not build them simply because they are attractive.
- New independent site, redesign, framework migration, new CRM/student table, or new dashboards are **not** default tasks.
- A true P0 incident, security/PII exposure, or existing production failure can override the order; log root cause, risk, evidence, resolution and resumption gate in Issue #328.
- Every PR must describe: **GATE ID / VC / origin+evidence / changed routes+files / DO NOT TOUCH / test & live check / rollback / Issue #328 link**. PR notes are review discipline; these fields are not enforced by an installed CI rule until separately authorized.
- If CI fails, debugging within current gate precedes new development. 'Code written' != 'CI PASS' != 'PRODUCTION VERIFIED' != '7-day OBSERVED' != 'DONE'.
- Track statuses: `PROPOSED`, `IN PROGRESS`, `BLOCKED`, `CI PASS`, `PRODUCTION VERIFIED`, `OBSERVED`, `DONE`. Distinguish hard facts, user reports, metrics, hypotheses and unknowns.
- Integrity review after each 3VC: duplicate sources, stale Project Sources, redirection of business facts, credentials, unused scope, new pages unregistered.

## 5. Protected boundaries

- No modifications to workshop production Supabase Auth/RLS/schema or reservation tables, no live purchase/booking test entries, no Stripe/Wallet/TIPS update.
- No unauthorized cookies/analytics, no GA4 ID assumed valid, no names/LINE IDs/emails/form input in URLs, repo files or event payloads.
- No changing the meaning of `OPEN`/`CLOSE`/`CANCELLED` or guaranteeing seat availability.
- Trial application handoff is user-validated; do not rewrite it unless a regression is demonstrated.
- Keep official `/rss/`, original URLs, 43 public SEO surfaces and existing image/photo truthfulness rules.
- Avoid updating generic `AI_OS_CREATION_RULES` for project-specific progress. Existing Source of Truth prevails.

## 6. MVP prioritization by measurable risk

1. **P0:** booking/first-trial flow, class schedule, live data freshness, safety.
2. **S:** admin/instructor access data and security controls; high severity irrespective of public page rank.
3. **P1:** price/class/instructor/access/workshop/event routing.
4. **P2:** media/music/rental/SEO improvements not blocking critical visitor flow.
5. **P3:** cosmetic polish, development-only tooling.

Each cycle scores `Impact × Evidence × Effort × Risk` and favors reversibility and shortest confirmed business path. User complaints/verified defects outrank inferred design preferences.

## 7. First executable step after adopting G0

**Revalidate PR #325 against `main` at head SHA, including runbook, code diff and CI; write a release/rollback note in Issue #328.** Do not silently merge it. Next, seek approval to set up independent watchdog credentials, then proceed G1.

## 8. Out-of-scope / post-MVP v1.1

- Conversion-rate A/B experiments, 30-day trend optimization, CRO rewrites and new sales funnels.
- New media programs and music catalog UI redesign, RSS migration or redesign.
- New CRM, automated LINE message ingestion, multi-device operations dashboard, new marketing data warehouse.
- Third-party SaaS integrations beyond the minimum approved monitoring + GSC/GA4 connection.
- Structural frontend rebuild or mandatory migration away from GitHub Pages.

## 9. Handoff template (paste in Issue #328 after every change)

```
GATE: G0/G1/G2/G3/G4/G5
VC: [one of up to 3 in this cycle]
STATUS: PROPOSED / IN PROGRESS / BLOCKED / CI PASS / PRODUCTION VERIFIED / OBSERVED / DONE
SOURCE: GitHub main SHA / PR / profile
CHANGE: paths + user journey
EVIDENCE: CI run / live URL / screenshot / timestamp (if available)
SAFETY: privacy / auth / data write / secrets / none
REGRESSION: P0 & affected routes
BLOCKER: verified, not guessed
NEXT SINGLE ACTION:
```

If the roadmap and the issue disagree on a business or technical fact, inspect `main` and fix the drift; never treat documentation status labels as proof of reality.
