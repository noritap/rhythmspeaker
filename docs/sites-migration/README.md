# Sites → GitHub migration review / 2026-10-31

Status: IMPLEMENTED IN REVIEW BRANCH, NOT APPROVED FOR PRODUCTION.
Source: Sites owner project appgprj_6ae3a914d8b881918b31f24eb4834732, saved version6, editable source commit d6dd29f85a3da73697c5738121ccf0228bc1fd01. This is source acquisition, not screenshot reconstruction.
Base main: 9b04d120ed7e94647f12a48a056573f39b28234a (RSS promotion #300).

## Implementation
10 static URLs retain the original paths; schedule/pricing are new. Shared vanilla CSS/JS, no framework migration. `scripts/build_sites_migration.cjs` generates server-independent HTML with visible content before JS. `tools/navigation_sync.py` then enforces the existing RS-NAV-2 lists.
`assets/ux-lab/` contains adapted scripts/styles. `data/ux-lab.json` is editorial data, not a contact registry. Official contacts come from `instructors/instructor-catalog.json`; the four explicitly supplied PR297 proposal contacts remain in a separate `data/instructor-contact-proposals.json`. Canonical catalog and PR297 unchanged.

## Restore / verify
From the repository root:
```
node scripts/build_sites_migration.cjs
python3 tools/navigation_sync.py
python3 tools/sites_migration_audit.py
python3 tools/test_public_class_projection.py
python3 tools/navigation_audit.py --strict
python3 tools/trial_cta_audit.py --strict
python3 scripts/class_photo_contract.py
python3 scripts/instructor_photo_contract.py
python3 tools/build_sites_preview.py /tmp/rs-preview
python3 -m http.server 8000 --directory /tmp/rs-preview
```
Open http://localhost:8000/rhythmspeaker/ and /rhythmspeaker/schedule/. Do not serve only /schedule/; base-path QA matters.
No GitHub Pages configuration, authentication, billing, Calendar or reservation setup is needed for the sample preview.

## Preserved surfaces
154 files in baseline.json are hash-checked: workshop operations, current RSS + legacy episode URLs, broadcast, trial/apply, class detail pages and instructor profiles. They retain existing HTML/CSS/JS. Same identity photos/assets are reused; there are zero new binary image files.
Registry lists stay intact. Compact Sites menu exposes scheduling/pricing/instructors as additional studio entries, with all-services visually separated. Main trial navigation button retains /trial/apply/ and its existing LINE prefill. New studio pages have noindex/nofollow during review; release must explicitly remove the review badge and noindex as appropriate.

## Data integration
No Calendar sync mechanism was found in baseline tracked HTML/JS/Python/workflows. `data/class-reservation-source.json` explicitly selects sample. `data/class-sessions.public.json` is an empty live/unavailable envelope, not invented live data.
`tools/public_class_projection.py` is a pure, offline normalization/projection boundary tested against synthetic data. It does not authenticate or poll Calendar, does not build a private mapping automatically, and does not manage counts. The server normalizer must retain cancellation metadata and map recurring/deleted events before calling it. Read the detailed handoff before live integration.
No actual applications, payment or reservations are submitted by this migration.

## Release gate
Owner approval is required before merge/deploy. Separately approve PR297 contacts and teacher/studio handoff; confirm Calendar IDs/read access/public criteria and confirmed-reservation ledger; run real mobile LINE/mail checks. Existing business boundaries stay separate.
See migration-map.md, qa-checklist.md, known-gaps.md, routes.json, ui-contract.json and data-contracts/.
