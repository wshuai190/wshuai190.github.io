#!/bin/sh
# Rebuild the trimmed self-hosted fonts in public/fonts (needs: pip install fonttools brotli).
# Newsreader comes from @fontsource-variable/newsreader; Manrope from its variable release
# (pass its path as $1 if you need to rebuild it).
set -e
cd "$(dirname "$0")/.."
LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+FEFF,U+FFFD"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,lnum,pnum,tnum,onum"
SRC=node_modules/@fontsource-variable/newsreader/files
TMP=$(mktemp -d)
python3 -m fontTools.varLib.instancer $SRC/newsreader-latin-opsz-normal.woff2 wght=400:600 -o $TMP/n.ttf -q
python3 -m fontTools.subset $TMP/n.ttf --unicodes="$LATIN" --layout-features="$FEATURES" --flavor=woff2 --output-file=public/fonts/newsreader-normal.woff2
python3 -m fontTools.varLib.instancer $SRC/newsreader-latin-opsz-italic.woff2 wght=400 opsz=16:72 -o $TMP/i.ttf -q
python3 -m fontTools.subset $TMP/i.ttf --unicodes="$LATIN" --layout-features="$FEATURES" --flavor=woff2 --output-file=public/fonts/newsreader-italic.woff2
if [ -n "$1" ]; then
  python3 -m fontTools.varLib.instancer "$1" wght=400:600 -o $TMP/m.ttf -q
  python3 -m fontTools.subset $TMP/m.ttf --unicodes="$LATIN,U+2318,U+21B5,U+2190-21FF,U+2600-26FF" --layout-features="$FEATURES" --flavor=woff2 --output-file=public/fonts/manrope.woff2
fi
ls -la public/fonts
