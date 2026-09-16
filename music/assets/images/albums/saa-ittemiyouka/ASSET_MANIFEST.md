# RSM-ALB-002 Web Asset Manifest

Release: RSM-ALB-002
Title: さあ、行ってみようか❗️
Visual Role: B_COVER_PUBLISHED_1X1
Aspect Ratio: 1:1
Status: APPROVED / ONE_COMMAND_LOCAL_IMPORT_READY

## Canonical Web Path

`/music/assets/images/albums/saa-ittemiyouka/saa-ittemiyouka_B_cover-published_1x1.jpg`

## Source

Current Conversation approved source:
- ChatGPT Image 2026年9月14日 06_18_08(1).png
- file_0000000030d481f8a06f0032d5df7861

Prepared local web derivative:
- `saa-ittemiyouka_B_cover-published_1x1.jpg`
- 1254 x 1254
- JPEG
- SHA-256: `aebff278c21183a2c16bead1c208211c721d4526c35ff42937058b4e19fca9c1`

## Required Placements

After the binary file exists at the canonical path, replace the temporary YouTube-derived representative visual in:

1. `/music/index.html`
   - Hero mini cover for RSM-ALB-002
   - Official Album card for RSM-ALB-002

2. `/music/albums/saa-ittemiyouka/index.html`
   - Main Album Visual

## One-command installer

Repository helper:
`/tools/install-rsm-album-cover.sh`

Usage from the `rhythmspeaker` repository:

```bash
bash tools/install-rsm-album-cover.sh "/absolute/path/to/saa-ittemiyouka_B_cover-published_1x1.jpg"
```

The script:
1. copies the approved B image to the canonical Web path,
2. replaces the three temporary YouTube-derived image references,
3. verifies the references,
4. stages the image and HTML changes,
5. commits,
6. pushes `main`.

## Usage Rule

Source of Truth:
`noritap/RHYTHM_SPEAKER_MUSIC_OS/docs/36_RSM_IMAGE_PLACEMENT_AND_USAGE_RULE.md`

`B = RELEASE IDENTITY`

Do not substitute A thumbnail or C playback visual as the permanent album cover.

## Production Guard

Do not change production HTML to the local canonical path before the image file exists in this repository. Avoid broken image states.
