# Ecosystem Next Patch

Next implementation patch should be deliberately small.

## Patch A — semantic consistency

Target: `ecosystem/index.html`

1. Hero paragraph
   - Remove development-state language.
   - Describe service discovery from the visitor's perspective.

2. ABOUT
   - Add Access.
   - Add FAQ.

3. Bottom note
   - Remove internal governance note from public output.

4. Card copy
   - Remove internal OS / repository / rollout wording where it does not help the visitor choose.

## Expected blast radius

One public HTML file only.
No navigation registry change.
No business-data change.
No pricing change.
No JS change.
No global CSS change.

## Release

Feature branch -> PR -> audits -> visual verification -> merge -> public verification.
