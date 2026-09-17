# HOME UX v3 implementation

Visual direction: approved 2026-09-17 mockup.

Principles:
- UX-first, beginner-first, CTA-first.
- Do not reuse one hero image everywhere.
- Prefer verified real studio and instructor imagery.
- Generated imagery may support generic mood/class imagery, but never replace instructor identity or misrepresent the actual studio.
- Primary CTA remains Official LINE / first trial.
- Current verified business facts remain authoritative: Ikebukuro 3 min, trial ¥1,000, no enrollment fee, tap shoes and wear available free, beginner STEP route.
- Preserve SEO / social metadata when simplifying page structure.

Phase 1 in branch `feat/home-ux-v3`:
- Rebuild homepage information architecture around Hero → Class Finder → Instructors → Studio → Beginner Flow → Conversion CTA.
- Add richer image rhythm and face-centered instructor presentation.
- Keep ecosystem and deeper content linked instead of overloading the first screen.

Timeout-safe delivery rule:
1. HTML structure changes are committed separately.
2. CSS / responsive changes are committed separately.
3. Image and binary asset changes are committed separately.
4. Do not store temporary Base64 text placeholders in production branches.
5. Verify each batch before starting the next batch.
6. Keep the PR Draft until desktop and mobile visual QA are complete.

Phase 1 QA checklist:
- Desktop: hero crop, class cards, instructor faces, studio imagery, CTA hierarchy.
- Mobile (~390 px): no horizontal scrolling, header/menu usable, cards remain readable, CTA does not overlap content.
- Instructor identity: no generated or identity-altering replacements.
- Studio truthfulness: no fabricated layout presented as the real location.
- Links: Class, Instructor, Trial, About/Studio, FAQ, Access and LINE destinations remain reachable.
- SEO/social: canonical, OGP and Twitter card metadata retained.

Phase 2:
- Apply the same visual system to Classes, Instructor hub, STEP/TAP, Trial, About/Studio, Access and FAQ.
