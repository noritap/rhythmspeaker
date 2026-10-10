# Revenue-First Infrastructure Policy (Rhythm Speaker)
Status: PROPOSED / local project policy; not an amendment to AI_OS_CREATION_RULES
Date: 2026-10-11

## Source and authority
- HOW TO BUILD: noritap/AI_OS_CREATION_RULES main
- WHAT PROJECT: this repository PROJECT_PROFILE.md
- CURRENT REALITY: this repository main
- External repositories, Supabase projects, billing, auth, production databases and secrets: READ/PROPOSE only until explicitly authorized.
- Workshop Manager live DB/Auth/Storage is protected; do not repurpose it for unrelated functions.

## Objective
Maximize incremental gross profit, avoided revenue loss and verified operator time saved per unit of total cost, without sacrificing safety or customer availability.

## Decision gates
G0 — Identify a measurable revenue funnel and owner; define baseline, attribution, recurring costs and availability requirement. Unknown outcomes stay UNKNOWN, not zero.
G1 — Use static hosting, GitHub Actions or event-triggered compute first when adequate; do not provision a database merely because a new feature exists.
G2 — Assign scarce free *active* project slots by proven value and uptime criticality, not first-come-first-served. Keep unused slots unallocated. A single backend can serve multiple functions only after tenant/data isolation, permissions, retention and blast-radius review.
G3 — Run a bounded free pilot. Record incremental gross profit, paid conversion, saved hours (separate from cash profit), outages, quota consumption and maintenance minutes weekly.
G4 — Paid upgrade candidate when (a) three consecutive months of *attributable incremental gross profit* >= 3x *all-in incremental monthly infrastructure cost*, or (b) documented expected lost margin from outages exceeds the incremental cost, or (c) a security/reliability requirement cannot be met on Free. The 3x/3-month threshold is a policy starting point, NOT a platform fact, and not an automatic spending approval.
G5 — Before paid activation, obtain explicit owner approval for plan, monthly budget ceiling, billing exposure, rollback, data backup and monitoring. No automatic upgrade or credit-card registration.
G6 — Scale only with verified demand; stop unsuccessful experiments but preserve code and legally retained data for reversible restart.

## Operation
- Customer-facing acquisition, payment and reservation entry points must not depend on manual pause/unpause.
- Never use artificial traffic to evade free-tier inactivity policies.
- Separate static public content from personal data. No personal information in GitHub public repositories.
- Alert on failed submission, error rates, paused services and quota; require recovery runbook before launch.
- Prefer asynchronous/background jobs for non-customer-facing tasks; document missed-job retry behavior.
- The two Supabase free active project slots are an *upper bound*, not a quota to fill. Existing inactive projects may have reactivation constraints; verify with provider before allocating.
- Existing workshop backend stays untouched without explicit architecture/safety approval.

## Initial project decisions
1. Keep workshop live operations unchanged; measure whether its value and availability justify its active slot.
2. Instructor registration: existing offline draft remains. Evaluate form + secure approval using Cloudflare Workers/D1, Supabase, or equivalent by total engineering cost, security, quota and deployment readiness. Do not claim online submission.
3. Revenue experiments: prioritize measurable acquisition, trial booking, repeat ticket purchases and follow-up over indirect admin features.
4. Guesthouse: inactive project stays preserved; do not delete, migrate or restart without authorization.

## Weekly scorecard (fill from actual evidence)
| System | Revenue baseline | Incremental gross profit | Lost-margin risk | Saved hours | All-in monthly cost | Manual minutes | Uptime incidents | Free quota headroom | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Workshop Manager | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | MEASURE |
| Instructor intake | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | 0 while offline | UNKNOWN | N/A | N/A | HOLD BACKEND |
| Revenue automation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DISCOVER |

## Scope
This is a Rhythm Speaker implementation policy and reusable proposal, NOT a cross-project rule change. Any upstream change to AI_OS_CREATION_RULES or REVENUE_STRATEGY_OS requires a separate explicit WRITE authorization.
