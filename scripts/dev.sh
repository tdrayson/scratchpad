#!/bin/sh
# Runs `tinyjs dev` as "Scratchpad Dev" so the menu bar shows which copy is running.
# tinyjs has no dev-only title, so tinyjs.json is swapped for the session and restored on exit.
cd "$(dirname "$0")/.."

restore() {
  sed -i '' 's/"title": "Scratchpad Dev"/"title": "Scratchpad"/' tinyjs.json
}
trap restore EXIT INT TERM

sed -i '' 's/"title": "Scratchpad"/"title": "Scratchpad Dev"/' tinyjs.json
tinyjs dev
