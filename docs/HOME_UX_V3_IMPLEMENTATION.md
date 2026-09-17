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

Phase 1 static QA completed:
- Canonical, OGP and Twitter card metadata are present.
- Temporary Base64 instructor placeholder was removed.
- Responsive guards exist for 1050 / 720 / 430 / 360 px breakpoints.
- Horizontal overflow is explicitly guarded.
- Header/CTA/card grids include mobile-specific sizing.
- Class, instructor, studio, access and LINE destinations remain linked.
- Instructor identity and studio-truthfulness guardrails remain unchanged.

Browser QA still required before merge:
- Desktop: hero crop, class cards, instructor faces, studio imagery, CTA hierarchy.
- Mobile (~390 px): no horizontal scrolling, header/menu usable, cards readable, CTA does not overlap content.
- Verify external Wix image loads for instructor portraits.
- Verify real-device LINE deep-link behavior.

Phase 2:
- Apply the same visual system to Classes, Instructor hub, STEP/TAP, Trial, About/Studio, Access and FAQ.
