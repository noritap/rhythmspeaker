# Ecosystem UX Implementation Handoff

Implementer should edit only `ecosystem/index.html` for the first public patch.

Read first:
- `docs/04_ECOSYSTEM_UX_AUDIT.md`
- `ecosystem/UX_FIX_SPEC.md`
- `docs/13_ECOSYSTEM_ABOUT_TARGET.md`
- `docs/16_ECOSYSTEM_DONE_DEFINITION.md`

Then run:

```bash
python tools/ecosystem_ux_audit.py
python tools/navigation_audit.py --strict
```

Expected initial state: ecosystem UX audit fails because the current public governance note remains.
Expected patched state: both audits pass.
