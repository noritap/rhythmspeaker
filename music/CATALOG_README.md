# RHYTHM SPEAKER MUSIC — Catalog v3

## Implementation

Canonical catalog: music/data/catalog.json. Current baseline: four albums, 52 tracks.

The music/explorer.js progressive enhancement reads this catalog to update home album cards, album track lists, track search, theme filters and user-initiated YouTube embed playback. Static page content remains as a no-JavaScript fallback. Existing album URLs are preserved.

## Update procedure

1. Enter track and album metadata in music/data/catalog.json. Never guess BPM or commercial rights.
2. Register an individual youtube_id and youtube_url only after verifying the exact track video. Otherwise use playback=playlist, youtube_id=null, youtube_url=null. Playlist-only playback is not a direct jump to a specific track.
3. Keep album art status accurate; VELVET CITY MOTION currently retains a temporary external visual.
4. Run node tools/music_catalog_audit.cjs and review PR CI before merging.
5. Check player behavior, fallback YouTube links, keyboard navigation, and mobile 320/375/390/430px in a browser.
6. Independently verify video/playlist URLs. Current YouTube links were transcribed from legacy HTML, not reverified externally.

## Planned further evolution

Current DISCO 001 intake (2026-11-01): 14 individual YouTube video IDs and durations confirmed from Studio; all 14 video visibility settings were unlisted when checked, while playlist was public. The representative image is temporary, album release date and commercial rights remain unverified, and only track 11 is independently labelled BONUS. Public Music listing does not change YouTube visibility.\n\nThe initial migration has a single runtime catalog but still contains independently authored no-JS HTML fallback and static social OGP tags. A static generator should eventually derive both from the canonical catalog. A new album currently also requires creating its stable fallback album page manually. Do not claim those operations have been automated.

Preserve existing rights restrictions: avoid offering download, sale or license before individual work and account rights are verified.
