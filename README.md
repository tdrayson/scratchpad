<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/banner-dark.png">
  <img alt="Scratchpad" src=".github/banner-light.png">
</picture>

# Scratchpad

A small macOS app for quick, throwaway notes — the home for everything you'd otherwise leave in an unsaved TextEdit window.

Notes age out on their own. Anything you haven't touched in a week starts going stale, a quick review lets you archive or keep it, and the archive clears itself after 30 days. Nothing piles up, and nothing is lost by accident.

<img src=".github/screenshots/write.png" alt="Write: type / for headings, checklists and code">

<p>
  <img src=".github/screenshots/search.png" width="49%" alt="Search: find anything with ⌘K">
  <img src=".github/screenshots/review.png" width="49%" alt="Review: old notes come back around">
</p>
<p>
  <img src=".github/screenshots/archive.png" width="49%" alt="Archive: everything stays recoverable for 30 days">
  <img src=".github/screenshots/sunset.png" width="49%" alt="Sunset theme: light by day, dark by night">
</p>

## Download

Grab the latest `Scratchpad-<version>-macos.zip` from [Releases](../../releases), unzip it and drag **Scratchpad** into Applications. It runs natively on Apple Silicon and Intel.

Scratchpad isn't notarised by Apple yet, so the first launch is blocked. Either open **System Settings → Privacy & Security** and click **Open Anyway**, or run:

```sh
xattr -dr com.apple.quarantine /Applications/Scratchpad.app
```

## Features

- **One rich editor.** Type `/` for blocks (headings, lists, checklists, quotes, code, dividers), or use Markdown shortcuts as you write. Every note starts with a title; notes save as you type.
- **Markdown out.** ⌘C copies Markdown alongside rich text; ⌘⇧C copies the whole note.
- **Notes that age out.** Active → going stale after 7 days → Review → Archive → deleted after 30 days. Both lengths are configurable.
- **Review.** Walk your stale notes one at a time: **E** archive, **K** keep for a while (1 day to 1 month, or a custom date), **↵** open.
- **Search everything.** ⌘K finds notes, including archived ones, and runs actions.
- **Capture from anywhere.** ⌥Space opens a new note from any app.
- **Themes.** System, Light, Dark, or Sunset — light by day and dark by night, following your local sunrise and sunset.
- **Yours to remap.** Every shortcut can be changed in Settings.
- **Export.** Save every note as a Markdown file into a folder of your choice.

## Shortcuts

| Action | Default |
| --- | --- |
| New note from anywhere | ⌥Space |
| New note | ⌘N |
| Search and actions | ⌘K |
| Show / hide sidebar | ⌘S |
| Previous / next note | ⌘⌥↑ / ⌘⌥↓ |
| Archive note | ⌘E |
| Undo archive | ⌘Z |
| Copy note as Markdown | ⌘⇧C |
| Review | ⌘⇧R |
| Archive | ⌘⇧A |
| Settings | ⌘, |

## Your data

Notes live in a local SQLite database at `~/Library/Application Support/com.tdrayson.scratchpad/scratchpad.db`. There's no account, no sync and no network access.

## Building from source

Requires [tinyjs](https://github.com/tarwin/tinyjsapp) and pnpm.

```sh
pnpm install
tinyjs dev            # run with hot reload
pnpm test             # unit and component tests
pnpm app:install      # build and replace /Applications/Scratchpad.app
pnpm app:release      # universal build, zipped into dist/release/
```

Built with tinyjs, Vue, Tailwind and TipTap.
