#!/bin/bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [ -z "$REPO_ROOT" ]; then
  echo "ERROR: run this script inside the rhythmspeaker git repository."
  exit 1
fi

# If a source path is provided, use it. Otherwise auto-detect from this Mac's
# configured download folder first, then fall back to ~/Downloads.
if [ $# -ge 1 ]; then
  SOURCE="$1"
else
  SEARCH_DIRS=(
    "/Volumes/1Tssd/inダウンロード"
    "$HOME/Downloads"
  )
  SOURCE=""
  for DIR in "${SEARCH_DIRS[@]}"; do
    [ -d "$DIR" ] || continue
    CANDIDATE="$(find "$DIR" -maxdepth 1 -type f \( \
      -iname '*06_19_38*' -o \
      -iname 'RSM_monogram_white_on_black.png' -o \
      -iname '*RSM*monogram*white*black*.png' \
    \) -print | head -n 1)"
    if [ -n "$CANDIDATE" ]; then
      SOURCE="$CANDIDATE"
      break
    fi
  done
fi

if [ -z "${SOURCE:-}" ]; then
  echo "ERROR: RSM primary monogram source was not found automatically."
  echo "Expected source: ChatGPT Image 2026年9月1日 06_19_38 (1)(1).png"
  echo "Primary search folder: /Volumes/1Tssd/inダウンロード"
  echo "You can also run: bash tools/install-rsm-logo.sh '/absolute/path/to/logo.png'"
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: source file not found: $SOURCE"
  exit 1
fi

echo "Using RSM logo source: $SOURCE"
cd "$REPO_ROOT"

DEST_DIR="music/assets/brand"
DEST="$DEST_DIR/RSM_monogram_white_on_black.png"
mkdir -p "$DEST_DIR"
cp "$SOURCE" "$DEST"

python3 <<'PY'
from pathlib import Path
import re

files = [
    Path('music/index.html'),
    Path('music/albums/velvet-city-motion/index.html'),
    Path('music/albums/saa-ittemiyouka/index.html'),
]

for path in files:
    text = path.read_text(encoding='utf-8')

    if path == Path('music/index.html'):
        logo_src = './assets/brand/RSM_monogram_white_on_black.png'
        favicon_src = './assets/brand/RSM_monogram_white_on_black.png'
    else:
        logo_src = '../../assets/brand/RSM_monogram_white_on_black.png'
        favicon_src = '../../assets/brand/RSM_monogram_white_on_black.png'

    text = re.sub(
        r'<link rel="icon" type="image/png" href="[^"]+">',
        f'<link rel="icon" type="image/png" href="{favicon_src}">',
        text,
        count=1,
    )

    if path == Path('music/index.html'):
        old = '<a class="brand" href="./" aria-label="RHYTHM SPEAKER MUSIC トップ"><strong>RHYTHM SPEAKER MUSIC</strong><span>RHYTHM SPEAKER / MUSIC</span></a>'
        new = (
            '<a class="brand brand--rsm" href="./" aria-label="RHYTHM SPEAKER MUSIC トップ">'
            f'<img class="brand-logo" src="{logo_src}" alt="" width="52" height="52">'
            '<span class="brand-copy"><strong>RHYTHM SPEAKER MUSIC</strong><span>MUSIC FOR A KINDER TOMORROW.</span></span>'
            '</a>'
        )
        if old in text:
            text = text.replace(old, new, 1)
        elif 'brand--rsm' not in text:
            raise SystemExit(f'ERROR: expected brand block not found in {path}')
    else:
        old_pattern = r'<a class="brand" href="\.\./\.\./"><strong>RHYTHM SPEAKER MUSIC</strong><span>OFFICIAL ALBUM</span></a>'
        new = (
            '<a class="brand brand--rsm" href="../../" aria-label="RHYTHM SPEAKER MUSIC トップ">'
            f'<img class="brand-logo" src="{logo_src}" alt="" width="52" height="52">'
            '<span class="brand-copy"><strong>RHYTHM SPEAKER MUSIC</strong><span>OFFICIAL ALBUM</span></span>'
            '</a>'
        )
        text, n = re.subn(old_pattern, new, text, count=1)
        if n == 0 and 'brand--rsm' not in text:
            print(f'WARN: brand block not replaced in {path}')

    path.write_text(text, encoding='utf-8')
PY

if ! grep -q 'brand--rsm' music/styles.css; then
cat >> music/styles.css <<'CSS'

/* RSM brand header enhancement */
.brand--rsm{display:inline-flex;align-items:center;gap:.8rem;min-width:0}
.brand--rsm .brand-logo{width:52px;height:52px;object-fit:contain;flex:0 0 auto;border-radius:10px}
.brand--rsm .brand-copy{display:flex;flex-direction:column;min-width:0;line-height:1.15}
.brand--rsm .brand-copy strong{font-size:.98rem;white-space:nowrap}
.brand--rsm .brand-copy>span{margin-top:.28rem;font-size:.62rem;letter-spacing:.13em;color:var(--muted);white-space:nowrap}
@media(max-width:800px){.brand--rsm .brand-logo{width:44px;height:44px}.brand--rsm .brand-copy strong{font-size:.88rem}.brand--rsm .brand-copy>span{display:none}}
@media(max-width:560px){.brand--rsm .brand-copy strong{font-size:.78rem;letter-spacing:.05em}.music-header{padding-inline:4%}}
CSS
fi

echo "--- verification ---"
ls -lh "$DEST"
grep -n "brand--rsm\|RSM_monogram_white_on_black" music/index.html music/albums/velvet-city-motion/index.html music/albums/saa-ittemiyouka/index.html | head -30

git add "$DEST" music/index.html music/albums/velvet-city-motion/index.html music/albums/saa-ittemiyouka/index.html music/styles.css

if git diff --cached --quiet; then
  echo "NOOP: RSM logo is already installed; nothing to commit."
  exit 0
fi

git commit -m "Use official RSM monogram across music web"
git push origin main

echo "DONE: official RSM monogram installed in header and favicon and pushed."
