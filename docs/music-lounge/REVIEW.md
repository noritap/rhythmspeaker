# Digital Record Lounge migration — review

Base main: `1999652412413103c97eafbe6b35cc48efc3a846` (2026-11-01).
Source: attached RSM_MUSIC_SITES_TO_GITHUB.zip, Sites version 3 exact source export.
Scope: /music/ and its regression checks; no production integration, YouTube changes, or edits to the original Sites project.

## Changes
- Import original HTML/CSS/JS with static GitHub Pages base-path adapter.
- HOME / DISCOVER / ALBUMS / four album details / LISTEN, official YouTube iframe/API, album playlists, per-track selection, album queue, previous/next, related records.
- Preserve existing four album direct-entry URLs and 52 track records. Add only source-derived liner notes; no IDs, rights, dates, BPM, or artwork invented.
- Preserve official artwork and explicit artwork-pending covers for two albums.
- Restore links to the main service menu, broadcasts, workshops and classes; retain canonical/OG metadata.
- Keep legacy explorer assets for rollback compatibility; new shells do not load them.
- Update old DOM-specific catalog/browser/live/copy tests to the new route contract. Existing workflow triggers remain unchanged.

## Verification
See QA_RESULTS.json. Package MANIFEST SHA-256 and source asset checks passed. Original album/track fields equal latest main. Node syntax, catalog audit, navigation audit/sync, sitewide copy, image regression guard (zero new issues), and Sites migration protected hashes passed.
Connected Chrome: 8 screens x 7 requested widths = 56 overflow checks; local images normal; search/combined filters/reset, queue selection, previous/next and player removal on exit verified. Official player reached playing state on VELVET CITY MOTION album selection. This is not an all-52-tracks full-duration audio certification.
CI runs the new Playwright suite against the actual branch. CI evidence is separate from connected-browser observations.

## Before / After assessment
| Area | Before | After |
|---|---|---|
| Navigation | Album landing + explorer | Four primary views and album detail routing |
| Discovery | Search + theme tags | Search + album + genre combination, zero-result reset |
| Listening | Inline video overlay | Dedicated lounge, queue, selected record, previous/next |
| Mobile | Existing responsive layout | 320/375/390/430 and 1280/1440/1920 checked |
| Catalog | 4 albums / 52 tracks | Same official fields + sourced liner notes |

No objective 90-point certification is claimed; responsive/function tests are measured separately from subjective design evaluation. Visual fidelity uses original exported source rather than reconstructed styling.

## Remaining issues / release gate
1. 19 tracks have no individual video IDs in latest main or the export. They intentionally open the album playlist and explicitly disclose that they do not jump to that track.
2. DISCO 001 / VELVET CITY MOTION have no official jacket in either source. Explicit artwork-pending covers remain.
3. Some DISCO videos were previously observed awaiting premieres. No YouTube settings were changed. Current all-track availability/full audio duration is unverified.
4. JavaScript rendering replaces static album track HTML; noscript links to the official channel. This is an SEO tradeoff. Canonical/OG metadata is retained; rich pre-rendered album content can be a separate enhancement.
5. `noindex,nofollow` and `PREVIEW` remain for approval-stage builds. After explicit release approval, remove preview indexing/copy gates in the development branch and repeat checks before merging. Do not merge this preview state unchanged.
6. Owner-private preview protects access, but GitHub Pages will be public. Existing catalog publication flags and video links are preserved.

Full requested content completeness is not met while items 1–3 remain. Do not claim all quality gates passed or merge automatically. User may explicitly accept existing catalog limitations before release.

## Integration / rollback
Re-fetch main and compare music changes before integration. After approval, remove preview gates, re-run branch CI and publish through the repository's existing GitHub Pages process. Verify the live URL, four direct album entries, catalog, images, search, queue and YouTube player. Revert this PR as a unit if necessary; no DB migration or external service change exists.
