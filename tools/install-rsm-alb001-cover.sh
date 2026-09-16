#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DOWNLOAD_DIR="/Volumes/1Tssd/inダウンロード"
SOURCE="${1:-}"

if [ -z "$SOURCE" ]; then
  for candidate in \
    "$DOWNLOAD_DIR/ベルベット・シティ・モーション.png" \
    "$DOWNLOAD_DIR/VELVET CITY MOTION.png" \
    "$DOWNLOAD_DIR/velvet-city-motion_B_cover-published_1x1.png" \
    "$DOWNLOAD_DIR/velvet-city-motion_B_cover-published_1x1.jpg"; do
    if [ -f "$candidate" ]; then
      SOURCE="$candidate"
      break
    fi
  done
fi

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "ERROR: ALB-001 official cover not found."
  echo "Expected one of these in: $DOWNLOAD_DIR"
  echo "  ベルベット・シティ・モーション.png"
  echo "  VELVET CITY MOTION.png"
  echo "  velvet-city-motion_B_cover-published_1x1.png"
  echo "  velvet-city-motion_B_cover-published_1x1.jpg"
  echo "Or run: bash tools/install-rsm-alb001-cover.sh /absolute/path/to/image"
  exit 1
fi

DEST_DIR="music/assets/images/albums/velvet-city-motion"
DEST="$DEST_DIR/velvet-city-motion_B_cover-published_1x1.png"
mkdir -p "$DEST_DIR"
cp "$SOURCE" "$DEST"

echo "Using ALB-001 cover source: $SOURCE"

python3 <<'PY'
from pathlib import Path
import re

old = "https://i.ytimg.com/vi/696Y1S6KX5Q/maxresdefault.jpg"
asset_top = "./assets/images/albums/velvet-city-motion/velvet-city-motion_B_cover-published_1x1.png"
asset_album = "../../assets/images/albums/velvet-city-motion/velvet-city-motion_B_cover-published_1x1.png"
asset_abs = "https://noritap.github.io/rhythmspeaker/music/assets/images/albums/velvet-city-motion/velvet-city-motion_B_cover-published_1x1.png"

# Music Top: replace temporary representative visual and remove temporary-only UI markers.
p = Path("music/index.html")
text = p.read_text(encoding="utf-8")
if old not in text:
    raise SystemExit("ERROR: expected ALB-001 temporary image URL not found in music/index.html")
text = text.replace(old, asset_top)
text = text.replace("hero-cover hero-cover--temporary-landscape", "hero-cover")
text = text.replace("release-media release-media--temporary-landscape", "release-media")
text = re.sub(r'<span class="release-visual-note">COVER PENDING</span>', '', text)
text = text.replace("VELVET CITY MOTION の暫定代表ビジュアル", "VELVET CITY MOTION 正式アルバムカバー")
text = text.replace("VELVET CITY MOTION 暫定代表ビジュアル", "VELVET CITY MOTION 正式アルバムカバー")
p.write_text(text, encoding="utf-8")

# ALB-001 page: canonical cover + absolute OGP image.
p = Path("music/albums/velvet-city-motion/index.html")
text = p.read_text(encoding="utf-8")
if old not in text:
    raise SystemExit("ERROR: expected ALB-001 temporary image URL not found in album page")
text = text.replace(old, asset_album)
text = text.replace('alt="VELVET CITY MOTION 代表ビジュアル"', 'alt="VELVET CITY MOTION 正式アルバムカバー"')
text = re.sub(r'<meta property="og:image" content="[^"]+">', f'<meta property="og:image" content="{asset_abs}">', text, count=1)
text = re.sub(r'<meta name="twitter:image" content="[^"]+">', f'<meta name="twitter:image" content="{asset_abs}">', text, count=1)
p.write_text(text, encoding="utf-8")

# ALB-002 related release: point to canonical ALB-001 cover.
p = Path("music/albums/saa-ittemiyouka/index.html")
text = p.read_text(encoding="utf-8")
text = text.replace(old, asset_album)
text = text.replace('alt="VELVET CITY MOTION representative visual"', 'alt="VELVET CITY MOTION 正式アルバムカバー"')
p.write_text(text, encoding="utf-8")
PY

echo "--- verification ---"
ls -lh "$DEST"
grep -n "velvet-city-motion_B_cover-published_1x1.png" \
  music/index.html \
  music/albums/velvet-city-motion/index.html \
  music/albums/saa-ittemiyouka/index.html

if grep -q "COVER PENDING\|temporary-landscape" music/index.html; then
  echo "ERROR: temporary ALB-001 UI markers still remain."
  exit 1
fi

git add \
  "$DEST" \
  music/index.html \
  music/albums/velvet-city-motion/index.html \
  music/albums/saa-ittemiyouka/index.html

git commit -m "Use official ALB-001 square cover on music web"
git push origin main

echo "DONE: RSM-ALB-001 official B cover installed and pushed."
