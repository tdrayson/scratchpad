#!/bin/sh
# Builds a universal (Apple Silicon + Intel) Scratchpad and zips it for download.
set -e
cd "$(dirname "$0")/.."

VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' tinyjs.json)
OUT="dist/release/Scratchpad-$VERSION-macos.zip"

tinyjs build --universal

mkdir -p dist/release
rm -f "$OUT"
# ditto keeps the bundle's symlinks, permissions and signature intact; zip -r does not.
ditto -c -k --keepParent dist/Scratchpad.app "$OUT"
echo "Release: $OUT"
