# Rhythm Speaker Studio Photo Reuse Workflow

Status: PROPOSED — apply after review
Scope: Official Web photo production, especially /trial/ YOUR START
Canonical identity: /PROJECT_PROFILE.md
Canonical visual policy: /docs/05_STUDIO_IMAGE_GROUNDING_RULE.md

## Goal
Avoid asking the user to upload the same studio reference photos in each new chat. GitHub main is the durable source of truth for reference files; never invent a studio from a textual description.

## Startup sequence (every new chat)
1. Read current main PROJECT_PROFILE.md, docs/05_STUDIO_IMAGE_GROUNDING_RULE.md and the target page HTML/CSS. Check relevant active PRs before edits.
2. Fetch or download the actual image bytes from assets/images/studio/reference/ (studio-01 through studio-06); verify existence, file type, dimensions and visually inspect the selected photos. Do not mistake a GitHub filename or metadata for an image supplied to the generator.
3. Choose the reference photo matching the camera angle and era of the intended composition. Respect floor, mirrors, acoustic panels, lighting, shelves, door and room layout; never merge conflicting periods into a fabricated present-day room.
4. If the current image-generation interface can receive fetched bytes as image references, supply the real photos. If it cannot, check whether the photos are already attached to the shared ChatGPT Project. If neither route works, disclose the transfer limitation and ask for only the minimum missing reference; do not generate an imagined studio.
5. Use real authorized people photos when appropriate, without regenerating identifiable instructors. Label staged/generated visuals appropriately. Do not imply generated people are actual students.
6. For YOUR START, make three distinct 16:10 mobile-safe scenes: STEP = instructor guiding first sound; TAP = expressive full-body musical movement (STEP first for beginners); BODY = accessible breathing/posture/mobility. Do not create all three in a single triptych intended for direct webpage use.
7. Review each scene individually against its exact reference, then compare at 375px width with headings hidden. Export approved assets as optimized WebP under assets/images/trial/.
8. Use a feature branch and PR. Check image paths, alt, intrinsic dimensions, loading, responsive crop, LINE CTA, and real GitHub Pages URLs after merge. Do not claim published until public URLs are verified.

## Reference inventory
- assets/images/studio/reference/studio-01.png
- assets/images/studio/reference/studio-02.jpg
- assets/images/studio/reference/studio-03.jpg
- assets/images/studio/reference/studio-04.jpg
- assets/images/studio/reference/studio-05.jpg
- assets/images/studio/reference/studio-06.jpg

## Transfer caveat
GitHub image availability does not guarantee direct image-reference transfer to the image-generation tool in every chat runtime. Prefer automatic retrieval; when transfer is unavailable, shared ChatGPT Project files are a secondary route. Do not promise universal zero-upload operation without testing that end-to-end route.
