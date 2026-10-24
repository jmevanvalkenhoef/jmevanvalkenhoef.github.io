#!/bin/sh
# Copy the projects' write-ups into the site, keeping their relative paths.
#   ./sync.sh [path/to/fips-lab] [path/to/shared-board]
# FIPS Lab: write-up 02 loads ../01-reroute/style.css and ../../../web/vendor/d3.min.js,
# so the folder layout is kept. Shared Board's write-up is self-contained.
set -eu
fips=${1:-../fips-lab}
board=${2:-../shared-board}

rm -rf fips-lab/experiments fips-lab/web
mkdir -p fips-lab/experiments fips-lab/web/vendor
cp -r "$fips/experiments/writeups" fips-lab/experiments/
cp "$fips/web/vendor/d3.min.js" fips-lab/web/vendor/

rm -rf shared-board/writeup
mkdir -p shared-board
cp -r "$board/experiment/writeup" shared-board/

rev() { git -C "$1" rev-parse --short HEAD 2>/dev/null || echo unknown; }
echo "copied write-ups from $fips ($(rev "$fips")) and $board ($(rev "$board"))"
