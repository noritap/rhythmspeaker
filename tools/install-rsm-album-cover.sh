#!/bin/bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 /path/to/saa-ittemiyouka_B_cover-published_1x1.jpg"
  exit 1
fi

SOURCE="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="$REPO_ROOT/music/assets/images/albums/saa-ittemiyouka"
DEST="$DEST_DIR/saa-ittemiyouka_B_cover-published_1x1.jpg"
MUSIC_TOP="$REPO_ROOT/music/index.html"
ALBUM_PAGE="$REPO_ROOT/music/albums/saa-ittemiyouka/index.html"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: source file not found: $SOURCE"
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SOURCE" "$DEST"

python3 - "$MUSIC_TOP" "$ALBUM_PAGE" <<'PY'
from pathlib import Path
import sys

music_top = Path(sys.argv[1])
album_page = Path(sys.argv[2])

old = "https://i.ytimg.com/vi/D-G9K6uzePI/maxresdefault.jpg"
new_top = "./assets/images/albums/saa-ittemiyouka/saa-ittemiyouka_B_cover-published_1x1.jpg"
new_album = "../../assets/images/albums/saa-ittemiyouka/saa-ittemiyouka_B_cover-published_1x1.jpg"

text = music_top.read_text(encoding="utf-8")
count = text.count(old)
if count < 2:
    raise SystemExit(f"ERROR: expected at least 2 temporary ALB-002 image refs in music/index.html, found {count}")
text = text.replace(old, new_top)
music_top.write_text(text, encoding="utf-8")

text = album_page.read_text(encoding="utf-8")
count = text.count(old)
if count < 1:
    raise SystemExit(f"ERROR: expected ALB-002 temporary image ref in album page, found {count}")
text = text.replace(old, new_album)
album_page.write_text(text, encoding="utf-8")
PY

cd "$REPO_ROOT"

echo "--- verification ---"
ls -lh "$DEST"
grep -n "saa-ittemiyouka_B_cover-published_1x1.jpg" "$MUSIC_TOP" "$ALBUM_PAGE"

git add \
  "music/assets/images/albums/saa-ittemiyouka/saa-ittemiyouka_B_cover-published_1x1.jpg" \
  "music/index.html" \
  "music/albums/saa-ittemiyouka/index.html"

git commit -m "Use official ALB-002 square cover on music web" || true
git push origin main

echo "DONE: RSM-ALB-002 official B cover installed and pushed."
