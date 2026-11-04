# RHYTHM SPEAKER | IDEA → SCORE → BUILD → VERIFY → RELEASE OS v1.0

Status: ACTIVE / 2026-11-04
Authority: Existing PROJECT_PROFILE.md, docs/ux/RS_WEB_UX_RULES_V2.md, NAVIGATION_REGISTRY and booking/privacy contracts take precedence.

## Goal
Increase genuine class/workshop participation, retention and verified revenue while preserving booking and financial integrity. Do not optimize only aesthetics, page clicks or speculative sales.

## Idea scorecard (100 points)
| Dimension | Max | Decision question |
|---|---:|---|
| Customer value / friction removal | 25 | Does the visitor accomplish a task more easily? |
| Revenue logic / funnel impact | 20 | Is the conversion path credible and measurable? |
| Data/source reuse | 15 | Are existing authoritative systems reused? |
| Trust, privacy and accessibility | 15 | Does this avoid misleading promises and privacy exposure? |
| Reliability and operability | 15 | Is failure safe and rollback feasible? |
| Testing and measurement | 10 | Can tests and real outcomes prove the change worked? |

90-100: eligible for implementation. 80-89: improve design. Below 80: hold. The score is an upfront judgment, not measured revenue uplift and not a substitute for QA.

## Mandatory release gates
- Never override a failing security, consent, identity, booking, payment, privacy, accessibility, protected-file or ledger invariant solely because the idea scores 90.
- A lesson calendar entry is not attendance, an inquiry is not a confirmed booking and a website click is not revenue.
- Keep official class publication and Workshop Manager as separate authoritative sources; link discovery safely, do not create a second booking ledger.
- All TIPS consumption must use authorized existing Functions, server-side financial checks, idempotency, audit trail and formal reversal policy.
- Never expose private calendar IDs/notes, attendee lists, credentials, personal member records, service role keys or reservation identities in public assets.
- Protected HTML revisions must be pinned to an explicit approved Git blob, never bypass the immutable SHA baseline.
- Auth, RLS/schema, new payment automation, sensitive data flows or higher-risk finance changes need PROJECT_PROFILE architecture authorization.
- Optional recommendations fail closed without blocking primary booking routes.
- PR CI and browser QA on 320/375/390/430/768/1440px must pass, including negative states. Verify live Pages after merge, not merely green source checks.

## Workflow
1. Read current main, active PRs, governing documents and production sources.
2. Present 1-3 actionable ideas, evidence, counterarguments, 100-point scores and cost/risk.
3. Select scores at least 90 with no architecture veto.
4. Develop the smallest safe feature branch with user journey, stable IDs, source-of-truth, fallback, rollback and metric definitions.
5. Test safe fixtures for database/financial features, plus accessibility, keyboard, mobile, links, staleness and regressions.
6. Create PR, fix all relevant CI failures and check exact protected-file approval.
7. Publish only inside the owner's authorization scope. Record actual merge, deploy, and production UI verification separately.
8. Measure 7- and 30-day confirmed booking, attendance, revenue and referral performance. Keep TIPS movement separate from Japanese-yen receipts.
9. Keep a written outcome and repeat the scoring cycle.

## Wave 1 (2026-11-04)
- VC1: /schedule/ current-month published workshop cards, existing live Workshop Manager: IDEA 96/100, PR #350.
- VC1a: Nov 22 old static workshop wording and live booking CTA correction: IDEA 97/100, PR #350.
- VC2: Wallet today's classes from official sanitized class projection: IDEA 95/100, planned separately.
- VC3: Class-selected TIPS consumption through existing authorized redemption path: IDEA 94/100, pending transaction/idempotency mapping and server/role tests.
- AI personalized recommendations: 85/100, held until consent and measurements justify complexity.

Do not claim that increased sales, completed bookings, actual revenue, live deployment or user adoption have been proven unless those have separately been verified.
