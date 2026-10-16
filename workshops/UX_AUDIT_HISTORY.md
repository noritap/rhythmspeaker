# Workshop Manager UX improvement log

## 2026-10-16 | PR #273 | Mobile reception UI

### Baseline
- Screenshot evidence: Chrome responsive 438 × 964, event reservation administration.
- Observed: content clipped to the right, horizontal scrolling, duplicate navigation, long operational lists, raw JSON audit records.
- Provisional screenshot-only UX score: 38/100. **Not a verified production score.**

### Changes made in this PR
1. Class roster: added payment/check-in action controls and corrected the all-buttons selector from `$` to `$$`.
2. Operations: introduced an at-a-glance completion banner; special allocation and waitlist/history use progressive disclosure; audit changes have Japanese action labels.
3. Mobile layout: responsive card actions, constrained overflow and improved touch target sizing; restored logout access in the compact navigation.
4. Automated static QA: `.github/workflows/workshop-manager-ux.yml` runs JavaScript syntax and key UI invariant checks on relevant pull requests.

### Known risks / not yet verified
- Static checks **do not** prove the page renders correctly at 320, 375, 390, 438 or 476 CSS pixels.
- Live Supabase sign-in, payment-state changes, check-in, special allocation and waitlist operations require authorized end-to-end QA.
- The operation-history table remains horizontally scrollable in its own container; a future mobile card presentation would be more usable.
- Global `overflow-x:clip` can mask rather than fix an overflowing child. Inspect `scrollWidth > clientWidth` for every major container during browser QA.
- Do not merge into main until the checks pass and the administrator approves deployment.

### Next QA evidence required
- Capture screenshots at 320/375/390/438/476 widths, with horizontal overflow measurements.
- Test keyboard focus and touch targets, event navigation and logout.
- Use non-production test records for state changes; verify bundle reservations show in both class rosters.
- Record before/after UX score and any regression with links to CI artifacts.

### Development rule
For every subsequent UX PR, append: baseline evidence, issue, root cause, change, tests, measured result, remaining risk, and next action. A successful commit is not evidence of a successful user interaction.
