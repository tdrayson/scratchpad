#!/bin/sh
# Builds Scratchpad and replaces the copy in /Applications, relaunching it if it was running.
set -e
cd "$(dirname "$0")/.."

if grep -q '"title": "Scratchpad Dev"' tinyjs.json; then
  echo "tinyjs.json still has the dev title; stop app:dev first." >&2
  exit 1
fi

APP="Scratchpad.app"
DEST="/Applications/$APP"

tinyjs build

running=false
if pgrep -f "$DEST/Contents/MacOS/" >/dev/null 2>&1; then
  running=true
  osascript -e 'quit app "Scratchpad"' || true
  while pgrep -f "$DEST/Contents/MacOS/" >/dev/null 2>&1; do sleep 0.2; done
fi

rm -rf "$DEST"
cp -R "dist/$APP" "$DEST"
echo "Installed $DEST"

if [ "$running" = true ]; then open "$DEST"; fi
