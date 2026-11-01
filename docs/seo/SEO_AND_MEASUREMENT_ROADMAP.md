# Rhythm Speaker｜SEO公開範囲・サイトマップ・CV計測運用 v1.0

Status: PROPOSED IN PR — 2026-11-02
Source of truth: `PROJECT_PROFILE.md` / `docs/ux/RS_WEB_UX_RULES_V2.md` / `docs/03_NAVIGATION_REGISTRY.md`.
This document is an operating extension. It does not replace those rules.

## VC1｜公開ページ台帳・サイトマップ

- `docs/seo/page-registry.json` is the explicit HTML index policy inventory (53 tracked HTML documents at creation).
- `public_html`: 43 user-facing stable pages; canonical URLs only.
- `excluded_html`: 9 noindex pages and one dynamic query-based event detail `workshops/event.html?slug=...` (not suitable for inclusion without a stable event URL inventory).
- Only pages in `public_html` go to `sitemap.xml`.
- `tools/sitemap_audit.py` fails PR CI when any newly tracked HTML is unclassified, when an excluded/noindex page loses noindex, if URL duplicates appear, or if canonical and sitemap URL conflict.
- Regeneration: `python tools/sitemap_audit.py --write`. Validation: `python tools/sitemap_audit.py` and `python tools/test_sitemap_audit.py`.
- No `<lastmod>` is emitted unless a reliable page-specific, significant-content update date can be calculated from a verified source. Historic static values from August/October are removed rather than rewritten to the current date without evidence. Google regards inaccurate lastmod as unreliable.
- Sitemap discovery does not guarantee search indexing. After release, verify `sitemap.xml` on Pages and submit/check in Google Search Console using a properly verified URL-prefix property.

## VC2｜Search presentation policy

| Route | Decision | Reason |
|---|---|---|
| `/rss/` | indexable canonical | Authoritative Rhythm Speaker Show public archive |
| `/rss/014/`, `/rss/015/` | indexable | Event history/official programs, stable route |
| `/rss-theater/` | noindex,follow; URL maintained | Duplicate/preview-like archive separate from canonical `/rss/` |
| `/rss-theater/qa/`, `/rss-theater/qa/program.html` | noindex,nofollow; URL maintained | Internal responsive QA surface |
| `/ui-style-catalog/` | noindex,nofollow; URL maintained | Design review/testing, not public customer landing |
| `/instructor-registration/`, `/instructor-submit/` | existing noindex | Instructor-only submissions; not part of public search |
| `/workshops/admin/`, `/workshops/instructor/`, `/workshops/instructor/edit.html` | existing noindex and actual Auth/RLS/token controls | Security is NOT provided by noindex |
| `/workshops/event.html?slug=...` | excluded from sitemap (but NOT noindex) | Database-driven event details. A future project should provide canonical stable event URLs or a safe verified dynamic sitemap before indexing individual events |

- Do NOT delete, redirect, or break any existing URLs. Existing `/rss-theater/` links continue working as a development/legacy entry.
- `noindex` is not an access restriction; keep token/Auth/RLS safeguards.
- Do NOT `Disallow` noindex pages in `robots.txt`, because a crawler needs to read the meta directive. Do not add both conflicting noindex and canonical hints to the same preview page.
- Future migration option: after all backlinks and routes are verified, `/rss-theater/` can become a redirect/compatibility link to `/rss/` if a suitable hosting mechanism exists. Out of scope here.

## VC3｜Visitor-to-booking measurement: reuse existing baseline, do not duplicate

Existing assets:
- `docs/02_CONVERSION_MEASUREMENT_BASELINE.md`
- `docs/04_TRIAL_CONVERSION_OPERATING_RUNBOOK.md`
- `data/trial_conversion_baseline.csv`
- `tools/trial_conversion_report.py`

### 3.1 Source table

| Funnel stage | Definition | Recommended source |
|---|---|---|
| Search exposure | impressions / clicks by canonical page | Google Search Console (URL-prefix property) |
| Page views | views by `page_path`, device, referral | GA4 or an approved privacy-conscious analytics platform |
| CTA intent | confirmed `line_cta_click` event for trial-specific CTA only; `trial_application_handoff` when appropriate | GA4 custom events after production measurement and privacy gates |
| Inquiry | genuine initial-trial inquiry; not an open-LINE action | Studio's aggregated manual count, or approved CRM metrics |
| Booking | explicit studio `予約確定` reply; not just a message sent | Studio's aggregated manual count |
| Visit | actually attended first trial | Reception/attendance aggregate |

If the incoming page cannot be reliably attributed to a booking, record it as `(unknown)` rather than guessing. Do not allocate the same booking to multiple pages. `line_cta_click` alone is not a booking. A form handoff to email is separate from a LINE click.

### 3.2 Observability rollout

1. Verify Google Search Console property ownership of `https://noritap.github.io/rhythmspeaker/`. Submit `sitemap.xml` once published, observe indexed/excluded URL reports and actual search queries.
2. Check whether an approved GA4 web data stream already exists. Obtain its real Measurement ID from the account; never invent it.
3. Confirm privacy/cookie policy and consent implications with the operator before installing tracking. Never send names, LINE identities, message text, preferred time/date, phone numbers, or email addresses as events/URL parameters.
4. Instrument only the agreed public conversion events, with `page_path`, `cta_location`, `cta_label`, `intent` (trial vs class consultation vs workshop).
5. Verify with GA4 DebugView/Realtime and real device test that event fires once, page attribution survives navigation, and no sensitive form data is emitted.
6. Weekly enter **aggregate only** counts from trusted sources in the existing CSV. Do not create a second student/booking ledger.
7. Run `python tools/trial_conversion_report.py` and compare 7-day/30-day windows. Revenue attribution must remain 'unknown' until booking/visits are reliably linked.
8. For workshop revenue or rental inquiries, define **separate** funnels and approved data boundaries. Do not mix Supabase reservation records or payment status into the studio-trial CSV.

### 3.3 Minimum reporting

Per page: search impressions and clicks; page views; trial-specific CTA clicks; line CTR; known trial inquiries; confirmed trial bookings; trial visits; unavailable metric reason. Segment primarily P0/P1 routes. Avoid interpreting a zero as a failure when measurement was never enabled.

### Gates / status

- [x] Baseline CSV/reporting script already exists.
- [x] Page inventory and target metrics are documented in this PR.
- [ ] Search Console property and sitemap submission verified.
- [ ] GA4 measurement ID / privacy review confirmed.
- [ ] Custom CTA events implemented and debug-verified.
- [ ] Real bookings/visits source established and aggregates recorded.
- [ ] 7- to 30-day outcome analysis completed.

User confirmation: initial trial application form (LINE/email handoff, copy, back behavior) has already been tested on smartphone and works; no modification to this UX is included here.

## Validation

- `python tools/sitemap_audit.py`
- `python tools/test_sitemap_audit.py`
- `python tools/trial_conversion_report.py`
- `python tools/navigation_audit.py --strict`
- `python tools/trial_cta_audit.py --strict`

Any production change must be verified on the live GitHub Pages URL after CI, not inferred solely from a green workflow.
