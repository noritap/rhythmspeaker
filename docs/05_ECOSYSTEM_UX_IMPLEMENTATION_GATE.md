# Ecosystem UX Implementation Gate

Before merging an `/ecosystem/` UX change:

- [ ] Current `main` rechecked
- [ ] RS-NAV-2 navigation unchanged or Registry updated first
- [ ] Public 7-category IA preserved
- [ ] Trial CTA routing unchanged
- [ ] Internal governance copy removed from public UI
- [ ] ABOUT exposes Access and FAQ
- [ ] Internal links checked
- [ ] `python tools/ecosystem_ux_audit.py` PASS
- [ ] Existing navigation audit PASS
- [ ] Mobile viewport visually checked
- [ ] Desktop viewport visually checked
- [ ] Public URL checked after merge

Visual/browser verification is mandatory before declaring the UI complete. Source-only inspection is not sufficient for spacing, overflow, sticky navigation, or interaction quality.
