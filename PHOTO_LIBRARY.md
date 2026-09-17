# RHYTHM SPEAKER OFFICIAL PHOTO LIBRARY

Canonical cross-chat photo source for Rhythm Speaker websites.

## Mandatory usage rule
Before selecting or generating imagery for any Rhythm Speaker website, check this library first.

Priority:
1. Verified real Rhythm Speaker photography in this library
2. Approved derived/cropped real photography
3. Clearly labeled generated/concept imagery only when no real asset fits and the use is non-factual

Never generate a fictional Rhythm Speaker studio, instructor, or named class scene when a suitable verified real photo exists. Never present generated imagery as factual documentation.

Allowed processing of real photos: crop, resize, compression, brightness/contrast, white balance, color correction, mild cleanup. Do not change a real person's identity or fabricate a named instructor.

## Canonical folders
- `assets/photo-library/real/studio/` — actual studio interior and facilities
- `assets/photo-library/real/access/` — building/route/entrance documentation
- `assets/photo-library/real/brand/` — physical brand objects and details
- `assets/photo-library/real/instructors/` — approved instructor photography
- `assets/photo-library/real/shoes/` — tap shoes/equipment
- `assets/photo-library/real/performance/` — stage/performance archive
- `assets/photo-library/generated/` — generated concept imagery; never factual by default

## Selection guidance
- Hero: choose a high-impact real photo with enough negative space for HTML text. Do not bake buttons or UI text into images.
- Class: choose an image that communicates the specific class outcome/movement; do not recycle one photo across unrelated classes.
- Instructor: use the newest approved real photo available; if none exists, report `MISSING`, do not generate a stand-in.
- Studio/About: use actual interior/facility photos.
- Access: use actual building, tenant sign, basement entrance and route photos in arrival order.
- Shoes/Equipment: use real equipment detail photography.

## Cross-chat rule
Any ChatGPT/Codex session working on a Rhythm Speaker website should search for and read this file plus `assets/photo-library/photo-library.json` before choosing imagery. If a needed real asset is absent, report the gap before generating a substitute.

## Current ingestion status
This repository is the canonical store. Existing approved web assets are cataloged first. Raw photos uploaded in chats are to be normalized and ingested here in small timeout-safe batches. New uploads should be added to this library rather than left only in a conversation.

Machine-readable catalog: `assets/photo-library/photo-library.json`
