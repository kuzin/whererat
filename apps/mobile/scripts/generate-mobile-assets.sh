#!/usr/bin/env bash
# Regenerate Expo icon + splash from web brand assets (requires ImageMagick `magick`).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# apps/mobile → monorepo root
REPO_ROOT="$(cd "$MOBILE_DIR/../.." && pwd)"

# Match web `globals.css` --wr-cheese / favicon `icon.svg`
BRAND_ORANGE_BG='#ea580c'

RAT_SRC="${REPO_ROOT}/public/brand/rat.svg"
ICON_OUT="${MOBILE_DIR}/assets/icon.png"
SPLASH_OUT="${MOBILE_DIR}/assets/splash.png"
# Cheese texture (source file in repo) — see assets/splash-source/SPLASH_IMAGE_LICENSE.txt
SPLASH_SRC_JPEG="${MOBILE_DIR}/assets/splash-source/cheese-texture-shutterstock.jpg"

if ! command -v magick >/dev/null 2>&1; then
  echo "Install ImageMagick (brew install imagemagick)" >&2
  exit 1
fi

if [[ ! -f "$RAT_SRC" ]]; then
  echo "Missing rat mark: $RAT_SRC" >&2
  exit 1
fi
if [[ ! -f "$SPLASH_SRC_JPEG" ]]; then
  echo "Missing splash source JPEG: $SPLASH_SRC_JPEG" >&2
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

echo "Splash from cheese texture JPEG → 1284×2778 (cover + brand tint)…"
# Landscape photo → portrait splash: fill frame, center-crop; light colorize toward brand orange.
magick "$SPLASH_SRC_JPEG" \
  -strip \
  -colorspace sRGB \
  -filter Lanczos \
  -resize '1284x2778^' \
  -gravity center \
  -extent 1284x2778 \
  -fill "${BRAND_ORANGE_BG}" \
  -colorize 20 \
  PNG24:"$SPLASH_OUT"

magick identify "$ICON_OUT" "$SPLASH_OUT"
echo "Done."
