# Ecosystem Minimum UX Fix Spec

Implementation target: `/ecosystem/index.html`

Apply only after the audit baseline is reviewed.

## Required changes

- Remove the public `eco-note` containing internal governance language.
- Replace hero development-state copy with user-centered service discovery copy.
- Add an Access card inside ABOUT linking to `../access/`.
- Add an FAQ card inside ABOUT linking to `../faq/`.
- Simplify internal/operator wording in Wallet, Music asset, Education and STORES cards without changing factual service roles.
- Preserve RS-NAV-2 generated global navigation exactly unless Navigation Registry is intentionally updated first.

## Acceptance criteria

`python tools/ecosystem_ux_audit.py` must PASS after implementation.

Do not change prices, TIPS behavior, payment/auth, global navigation, Public 7-category IA, or Trial conversion routing in this fix.
