#!/usr/bin/env bash
# Regenerate Expo icon + splash from web brand assets (requires ImageMagick `magick`).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# apps/mobile → monorepo root
REPO_ROOT="$(cd "$MOBILE_DIR/../.." && pwd)"

RAT_SRC="${REPO_ROOT}/public/brand/rat.svg"
ICON_OUT="${MOBILE_DIR}/assets/icon.png"
SPLASH_OUT="${MOBILE_DIR}/assets/splash.png"

if ! command -v magick >/dev/null 2>&1; then
  echo "Install ImageMagick (brew install imagemagick)" >&2
  exit 1
fi

if [[ ! -f "$RAT_SRC" ]]; then
  echo "Missing rat mark: $RAT_SRC" >&2
  exit 1
fi

COMPOSITE_SVG="$(mktemp "${TMPDIR:-/tmp}/whererat-app-icon.XXXXXX.svg")"
cleanup() { rm -f "$COMPOSITE_SVG"; }
trap cleanup EXIT

echo "Compositing rat.svg → app icon (1024×1024)…"
python3 - "$RAT_SRC" "$COMPOSITE_SVG" <<'PY'
import re, pathlib, sys

rat_path = pathlib.Path(sys.argv[1])
out_path = pathlib.Path(sys.argv[2])
text = rat_path.read_text()
m = re.search(r'<path\s+d="([^"]+)"', text)
if not m:
    raise SystemExit(f"Could not find <path d=\"...\"> in {rat_path}")
d = m.group(1)
# Center the rat viewBox (293.29×252.34) on a 512×512 square with rounded amber field.
svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#f59e0b"/>
  <g fill="#1c1917" transform="translate(109.355,129.83)">
    <path d="{d}"/>
  </g>
</svg>
'''
out_path.write_text(svg)
PY

magick -density 360 -background none "$COMPOSITE_SVG" -resize 1024x1024 PNG32:"$ICON_OUT"

echo "Generating cheese splash (1284×2778)…"
magick -size 1284x2778 \( plasma:'#fef3c7-#f59e0b' -colorspace sRGB \) \
  -blur 0x18 \
  \( +clone -colorspace gray +noise Random -blur 0x1.2 \) \
  -compose softlight -composite \
  \( +clone -colorspace gray +noise Random -resize 60% -blur 0x8 -resize 167%! \) \
  -compose multiply -composite \
  -modulate 108,92,103 \
  \( -size 1284x2778 xc:none \
     -fill 'rgba(180,83,9,0.12)' -draw 'ellipse 320,400 45,35 0,360' \
     -fill 'rgba(146,64,14,0.08)' -draw 'ellipse 900,1200 55,40 15,360' \
     -fill 'rgba(217,119,6,0.1)' -draw 'ellipse 200,2100 50,38 -20,360' \
     -fill 'rgba(180,83,9,0.11)' -draw 'ellipse 1000,2400 48,36 30,360' \
     -blur 0x6 \
  \) \
  -compose over -composite \
  PNG24:"$SPLASH_OUT"

magick identify "$ICON_OUT" "$SPLASH_OUT"
echo "Done."
