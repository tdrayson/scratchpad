<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/banner-dark.png">
  <img alt="Scratchpad" src=".github/banner-light.png">
</picture>

# Scratchpad

**[Installation](#installation)** · **[Documentation](#documentation)** · **[Contributing](#contributing)**

A small macOS app for the notes you never meant to keep: a phone number for the next ten minutes, a shopping list, the snippet you're about to paste somewhere else. You know, the stuff currently living in eleven unsaved TextEdit windows, each one guarding its contents behind a "Do you want to save?" prompt.

Scratchpad gives those notes somewhere to go, and then politely shows them the door. Anything you haven't touched in a week comes back for a quick review, you archive what's done, and the archive tidies itself up after 30 days. Nothing goes without fair warning.

- **Local only.** Nothing leaves your Mac. No account, no sync, no tracking.
- **Rich editor.** `/` for blocks, or plain Markdown shortcuts.
- **Autosave.** No save button, no "Do you want to save?"
- **Notes age out.** Stale after a week, deleted 30 days after archiving.
- **Review.** Archive, keep or open stale notes, one key each.
- **⌘K search.** Every note, archived ones too, plus actions.
- **Quick capture.** ⌥Space from any app.
- **Markdown in and out.** Copy notes as Markdown, export everything as a zip, or import a pile of `.md` files.
- **Sunset theme.** Light by day, dark by night.
- **Remappable shortcuts.** All of them.

![Write: type / for headings, checklists and code](.github/screenshots/write.png)

<div align="center">
  <img src=".github/screenshots/search.png" width="412" alt="Search: find anything with ⌘K">
  <img src=".github/screenshots/review.png" width="412" alt="Review: old notes come back around">
  <img src=".github/screenshots/sunset.png" width="412" alt="Sunset theme: light by day, dark by night">
  <img src=".github/screenshots/archive.png" width="412" alt="Archive: everything stays recoverable for 30 days">
</div>

## Installation

Download the zip for your Mac from [Releases](../../releases): `apple-silicon` for M-series Macs, `intel` for older ones (Apple menu → About This Mac tells you which). Unzip it and move **Scratchpad** to Applications.

The app isn't notarised by Apple, so macOS will refuse to open it the first time, with its usual air of mild suspicion. Either open **System Settings → Privacy & Security** and click **Open Anyway**, or run:

```sh
xattr -dr com.apple.quarantine /Applications/Scratchpad.app
```

If you'd rather not take a stranger's app on trust (fair), [build it yourself](#contributing).

## Local only

Your notes stay on your Mac. That's not a setting; it's the only way it works.

- **One file.** Notes live in a SQLite file on your disk, and nowhere else.
- **No network.** No account, sync, analytics, crash reports or update checks. It doesn't phone home; it doesn't have the number.
- **No Location Services.** Sunset times are worked out on-device from your time zone, or a city you pick.
- **Local reminders.** Plain macOS notifications, scheduled by the app.

The only way a note leaves your Mac is if you copy or export it.

## Documentation

### How notes age out

1. **Active.** Recently edited, under Today and This week.
2. **Going stale.** Untouched for 7 days. Moves to the bottom of the sidebar, age in orange.
3. **Review** (⌘⇧R). One note at a time: **E** archive, **K** keep for a while, **↵** open.
4. **Archive** (⌘E). Out of the way, still searchable, restorable. ⌘Z undoes it.
5. **Deleted.** 30 days after archiving. Or sooner with ⌘⌫, if you're feeling decisive.

All the timings can be changed in Settings.



### Writing

- **Title first.** Every note starts with a title; it's what the sidebar and search show.
- **Blocks.** Type `/` for headings, lists, checklists, quotes, code and dividers.
- **Markdown shortcuts.** `##`, `-`, `[]`, `>`, ````` and `---` as you type. Can be turned off.
- **Autosave.** Notes save as you type.
- **Copy as Markdown.** ⌘C copies Markdown with the rich text; ⌘⇧C copies the whole note.
- **Quick capture.** ⌥Space opens a new note from any app, even when hidden.



### Finding notes

- **⌘K** searches every note, archived ones too, and runs actions.
- **⌘⌥↑ / ⌘⌥↓** step through notes in sidebar order.
- **⌘S** hides the sidebar. Hover the left edge to peek.



### Settings

Open with ⌘,.

- **General:** theme, text size, quick capture, launch at login, Markdown shortcuts, spell check.
- **Review & Archive:** stale after, default keep length, reminder, Dock badge, archive length.
- **Shortcuts:** remap anything.
- **Data:** export and import.



### Shortcuts


| Action                          | Default   |
| ------------------------------- | --------- |
| New note from anywhere          | ⌥Space    |
| New note                        | ⌘N        |
| Search and actions              | ⌘K        |
| Show / hide sidebar             | ⌘S        |
| Previous / next note            | ⌘⌥↑ / ⌘⌥↓ |
| Archive note                    | ⌘E        |
| Undo archive                    | ⌘Z        |
| Delete permanently (in Archive) | ⌘⌫        |
| Copy note as Markdown           | ⌘⇧C       |
| Review                          | ⌘⇧R       |
| Archive                         | ⌘⇧A       |
| Settings                        | ⌘,        |




### Your data

Your notes are private. They're stored on your Mac and never sent anywhere: Scratchpad has no servers, no account, no sync and no analytics, and it makes no network requests at all. Nobody else can read your notes, including me. Notes only leave your Mac if you copy or export them yourself.

Everything is in one file:

```
~/Library/Application Support/com.tdrayson.scratchpad/scratchpad.db
```

- **Back up:** copy that file while Scratchpad is closed.
- **Export:** Settings → Data → Export. Saves a zip with one `.md` file per note, archived notes in an `Archive` folder (optional).
- **Import:** drop a zip, a folder or some `.md` files on Settings → Data. Each file becomes a note and keeps its date, anything in an `Archive` folder goes straight to the archive, and notes you already have are skipped. Handy for moving from another app, or another Mac.
- **Uninstall:** delete the app and that folder.



## Contributing

Issues and pull requests are welcome. To build it yourself you need [tinyjs](https://github.com/tarwin/tinyjsapp) and pnpm:

```sh
pnpm install
tinyjs dev            # run with hot reload
pnpm test             # unit and component tests
pnpm app:install      # build and replace /Applications/Scratchpad.app
pnpm app:release      # Apple Silicon and Intel zips in release/
```

Built with tinyjs, Vue, Tailwind and TipTap.
## License

[MIT](LICENSE). Do what you like with it.
