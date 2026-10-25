#!/bin/sh
# Copy the projects' write-ups into the site, keeping their relative paths.
#   ./sync.sh [path/to/fips-lab] [path/to/shared-board] [path/to/g2c]
# FIPS Lab: write-up 02 loads ../01-reroute/style.css and ../../../web/vendor/d3.min.js,
# so the folder layout is kept. The Shared Board and G2C write-ups are self-contained.
set -eu
fips=${1:-../fips-lab}
board=${2:-../shared-board}
g2c=${3:-../g2c}

rm -rf fips-lab/experiments fips-lab/web
mkdir -p fips-lab/experiments fips-lab/web/vendor
cp -r "$fips/experiments/writeups" fips-lab/experiments/
cp "$fips/web/vendor/d3.min.js" fips-lab/web/vendor/

rm -rf shared-board/writeup
mkdir -p shared-board
cp -r "$board/experiment/writeup" shared-board/

rm -rf g2c/writeup g2c/white-paper.pdf
mkdir -p g2c
cp -r "$g2c/sim/writeup" g2c/
cp "$g2c/docs/WHITE_PAPER.pdf" g2c/white-paper.pdf

rev() { git -C "$1" rev-parse --short HEAD 2>/dev/null || echo unknown; }
echo "copied write-ups from $fips ($(rev "$fips")), $board ($(rev "$board")) and $g2c ($(rev "$g2c"))"
