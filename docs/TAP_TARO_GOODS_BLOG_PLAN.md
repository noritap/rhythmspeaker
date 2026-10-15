# リズムタプ太郎がおすすめするグッズ紹介 — 公開前設計

## Decision
- The previous independent affiliate-blog concept is superseded by an isolated editorial section on the existing Rhythm Speaker official website: `/tap-taro-goods/`.
- This is an unmerged proposal, **not public**.
- Keep official homepage, `/trial/`, and LINE primary conversion intact. Do not change workshop/Auth/RS Wallet.
- `TAP_TARO_OS` is the canonical persona; do not fabricate personal experience or let the character impersonate a real product tester.
- `REVENUE_STRATEGY_OS` REV-009 remains the revenue/measurement source of truth, with authenticated registered-site and primary-surface gates open.

## Content pillars
1. Tap shoes and beginner selection.
2. Practice floors, noise reduction, safe home practice.
3. Filming, audio and studio operation accessories.

## Draft-to-publication plan
1. Revenue OS selects topics with documented buyer intent and verifiable source evidence.
2. Draft generation creates structured articles, not fabricated reviews. Clearly distinguish tested by Furusho vs research-only.
3. Product links must be verified Special Links for a registered Amazon publishing destination. Affiliate disclosure visible before links.
4. QA: factuality, duplication, title/description, mobile accessibility, link integrity, rights, Amazon policies, no stale price/availability.
5. Generate a branch/PR in `noritap/rhythmspeaker`. Never auto-merge to main without explicit scoped owner approval.
6. After separate production authorization, optionally permit limited automatic publishing for pre-approved topics/products under standing written policy and rollback.
7. Track affiliate clicks, earnings, EPC, owner minutes, and LINE trial conversions separately.

## Current status
- Landing-page prototype only. `noindex,nofollow` intentionally prevents indexing before editorial readiness.
- No Amazon links, no product reviews, no external scripts, no credentials.
- GitHub Actions automated writing/publishing has **not** been integrated into this repository.
- Review homepage link placement only after layout QA. No navigation changes in this PR.
- Before publishing: confirm Amazon Associates registered media includes the intended official site, Tracking ID plan, owner editorial signoff and main merge approval.
