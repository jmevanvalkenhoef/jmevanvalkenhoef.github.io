#!/bin/sh
# Copy the FIPS Lab write-ups into the site, keeping their relative paths
# (02 loads ../01-reroute/style.css and ../../../web/vendor/d3.min.js).
#   ./sync.sh [path/to/fips-lab]
set -eu
src=${1:-../fips-lab}
dst=fips-lab
rm -rf "$dst/experiments" "$dst/web"
mkdir -p "$dst/experiments" "$dst/web/vendor"
cp -r "$src/experiments/writeups" "$dst/experiments/"
cp "$src/web/vendor/d3.min.js" "$dst/web/vendor/"
echo "copied write-ups from $src ($(git -C "$src" rev-parse --short HEAD 2>/dev/null || echo unknown))"
