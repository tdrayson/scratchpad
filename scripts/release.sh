#!/bin/sh
# Builds Scratchpad for Apple Silicon and Intel and zips each for download.
set -e
cd "$(dirname "$0")/.."

if grep -q '"title": "Scratchpad Dev"' tinyjs.json; then
  echo "tinyjs.json still has the dev title; stop app:dev first." >&2
  exit 1
fi

VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' tinyjs.json)
mkdir -p release

for pair in "arm64:apple-silicon" "x86_64:intel"; do
  ARCH=${pair%%:*}
  OUT="release/Scratchpad-$VERSION-${pair#*:}.zip"
  tinyjs build --arch "$ARCH"
  rm -f "$OUT"
  # ditto keeps the bundle's symlinks, permissions and signature intact; zip -r does not.
  ditto -c -k --keepParent dist/Scratchpad.app "$OUT"
  echo "Release: $OUT"
done
