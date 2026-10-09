<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/banner-dark.png">
  <img alt="Scratchpad" src=".github/banner-light.png">
</picture>

# Scratchpad

A small macOS app for quick, throwaway notes: the phone number you need for ten minutes, a list for today, a snippet you're about to paste somewhere else. It's meant to replace the unsaved TextEdit windows that pile up for weeks.

## Local only

Scratchpad runs entirely on your Mac.

- Notes are stored in a SQLite file on your disk and nowhere else.
- The app makes no network requests: no account, no sync, no analytics, no crash reporting, no update checks.
- The Sunset theme works out sunrise and sunset on-device from your time zone (or a city or coordinates you enter). It doesn't use Location Services.
- Reminders are ordinary macOS notifications, scheduled by the app itself.

Your notes leave your Mac only when you copy or export them.

## How notes age out

Every note moves through the same stages, so old notes don't build up:

1. **Active.** Notes you've edited recently, grouped in the sidebar under Today and This week.
2. **Going stale.** A note you haven't edited for 7 days moves to Going stale at the bottom of the sidebar, with its age shown in orange.
3. **Review.** Review (⌘⇧R) walks through stale notes one at a time. Press **E** to archive, **K** to keep it (it comes back after 1 day to 1 month, or a date you pick), or **↵** to open it.
4. **Archive.** Archived notes (⌘E) are out of the way but still searchable and can be restored. ⌘Z undoes an archive straight away.
5. **Deleted.** Archived notes are deleted for good after 30 days. You can also delete one early (⌘⌫) or empty the archive.

Both periods, the default keep length, a weekly reminder when notes are waiting for review and a Dock badge with the stale count can all be changed in Settings.

## Writing

- One rich-text editor. Each note starts with a title line, and the title is what the sidebar and search show.
- Type `/` for blocks: text, H2, H3, bullet and numbered lists, checklists, quotes, code blocks and dividers. Markdown shortcuts (`##`, `-`, `[]`, `>`, ` ``` `, `---`) work as you type and can be turned off.
- Notes save as you type; there's no save button.
- ⌘C copies the selection as Markdown alongside the rich text, so it pastes cleanly into both kinds of app. ⌘⇧C copies the whole note as Markdown.
- ⌥Space opens a new note from any app, even when Scratchpad is hidden.

## Finding notes

- ⌘K searches the title and text of every note, archived ones included, and also runs actions such as New note, Review and Settings.
- ⌘⌥↑ and ⌘⌥↓ step through notes in sidebar order.
- ⌘S hides the sidebar; move the pointer to the left edge to peek at it.

## Settings

Open with ⌘,.

- **General:** theme (System, Light, Dark or Sunset, which is light between sunrise and sunset with optional offsets), editor text size, the ⌥Space shortcut, menu bar icon, launch at login, Markdown shortcuts, spell check, and export.
- **Review & Archive:** when notes go stale, the default keep length, the review reminder, the Dock badge, and how long archived notes are kept.
- **Shortcuts:** every shortcut can be remapped.

<img src=".github/screenshots/write.png" alt="Write: type / for headings, checklists and code">

<p align="center">
  <img src=".github/screenshots/search.png" width="48%" alt="Search: find anything with ⌘K">
  &nbsp;&nbsp;
  <img src=".github/screenshots/review.png" width="48%" alt="Review: old notes come back around">
</p>
<p align="center">
  <img src=".github/screenshots/sunset.png" width="48%" alt="Sunset theme: light by day, dark by night">
  &nbsp;&nbsp;
  <img src=".github/screenshots/archive.png" width="48%" alt="Archive: everything stays recoverable for 30 days">
</p>

## Install

Download `Scratchpad-<version>-macos.zip` from [Releases](../../releases), unzip it and move **Scratchpad** to Applications. It runs on Apple Silicon and Intel Macs.

The app isn't notarised by Apple, so macOS blocks the first launch. To allow it, either open **System Settings → Privacy & Security** and click **Open Anyway**, or run:

```sh
xattr -dr com.apple.quarantine /Applications/Scratchpad.app
```

You can also build it yourself; see [Building from source](#building-from-source).

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
| Delete permanently (in Archive) | ⌘⌫ |
| Copy note as Markdown | ⌘⇧C |
| Review | ⌘⇧R |
| Archive | ⌘⇧A |
| Settings | ⌘, |

## Your data

Everything is in one folder:

```
~/Library/Application Support/com.tdrayson.scratchpad/scratchpad.db
```

- **Back up:** copy that file while Scratchpad is closed.
- **Export:** Settings → General → Export all notes writes one Markdown file per note into a folder you choose.
- **Uninstall:** delete the app and that folder.

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
