# Mobile conversion regression matrix (draft)

Scope: read-only QA for the public website. This work deliberately avoids editing HTML, CSS, navigation registry, trial/class copy, instructor flows, pricing, and published assets while existing PRs #268, #264, #261, #258, #242, #239, #188, #178, #160, #115 remain open.

## Acceptance checks

| ID | Surface | Viewport | Expected behavior |
| --- | --- | --- | --- |
| M01 | / | 390px | Primary trial CTA visible and actionable without horizontal overflow |
| M02 | /trial/ | 390px | Beginner journey clear; LINE CTA points to official LINE |
| M03 | /classes/ | 390px | Classes readable; no clipped cards; trial action discoverable |
| M04 | /faq/ | 390px | FAQ text readable; contact path works |
| M05 | /access/ | 390px | Address and navigation readable |
| M06 | /ecosystem/ | 390px | SHOP and Wallet not presented as primary first-trial CTA |
| M07 | global navigation | 390px | Keyboard and touch controls accessible; no dead links |
| M08 | all primary pages | 320px, 390px, 768px | No horizontal overflow; buttons have accessible names |

## Evidence requirements

Capture page URL, base commit SHA, viewport, screenshot or test log, observed/expected behavior, and pass/fail for each check. Run navigation audit `python3 tools/navigation_audit.py --strict` where supported. Do not assert PASS without execution evidence.

## Non-goals / approval gates

No live copy edits, class pricing, instructors, reservation behavior, LINE destination, payment, authentication, or deployment changes. Any discovered issue must become a separate scoped task after conflict review. Merge/publication requires owner approval.
