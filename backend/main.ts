import type { Database } from 'tjs:sqlite'
import { isPurgeable, isStale } from '../src/shared/lifecycle'
import { resolveShortcuts } from '../src/shared/shortcuts'
import { startOfDay } from '../src/shared/time'
import type { NotePatch, Settings } from '../src/shared/types'
import { openDb } from './lib/db'
import { exportNotes } from './lib/exporter'
import { NoteStore } from './lib/notes'
import { SettingsStore } from './lib/settings'

const SWEEP_MS = 60_000

let db: Database
let notes: NoteStore
let settings: SettingsStore
let ready: Promise<void>

/**
 * Opens storage once; every api call awaits it.
 * @param app - The tinyjs app handle.
 */
async function boot(app: TinyApp): Promise<void> {
  db = await openDb(app.paths.data)
  notes = new NoteStore(db)
  settings = new SettingsStore(db)
}

/**
 * Tells every window the note list changed.
 * @param app - The tinyjs app handle.
 */
function changed(app: TinyApp): void {
  app.push('notes-changed')
}

/**
 * Purges expired archive entries, refreshes the Dock badge and sends the daily review reminder.
 * @param app - The tinyjs app handle.
 */
function sweep(app: TinyApp): void {
  const now = Date.now()
  const s = settings.get()
  const all = notes.list()
  const expired = all.filter((n) => isPurgeable(n, s.archiveDays, now))
  for (const n of expired) notes.remove(n.id)
  if (expired.length) changed(app)

  const stale = all.filter((n) => isStale(n, s.staleDays, now)).length
  app.badge(s.dockBadge && stale ? String(stale) : '')

  const today = String(startOfDay(now))
  const minute = Math.floor((now - startOfDay(now)) / 60_000)
  const due = s.reminder.day === null || new Date(now).getDay() === s.reminder.day
  if (s.reminder.enabled && due && stale && minute >= s.reminder.time && settings.meta('reminded') !== today) {
    settings.setMeta('reminded', today)
    app.notify({
      title: 'Notes to review',
      body: stale === 1 ? '1 note is going stale.' : `${stale} notes are going stale.`,
    })
  }
}

/**
 * Applies the OS-level settings: quick-capture hotkey, menu bar icon and launch at login.
 * @param app - The tinyjs app handle.
 * @param s - The current settings.
 */
function applySystem(app: TinyApp, s: Settings): void {
  app.hotkey.unregister('quickCapture')
  const combo = resolveShortcuts(s.shortcuts).quickCapture
  if (s.quickCapture && combo) app.hotkey.register('quickCapture', combo)

  if (s.menuBarIcon) {
    app.tray.set({
      icon: 'sf:note.text',
      tooltip: 'Scratchpad',
      menu: [
        { id: 'new', label: 'New note' },
        { id: 'review', label: 'Review' },
        { separator: true },
        { id: 'open', label: 'Open Scratchpad' },
        { id: 'quit', label: 'Quit Scratchpad' },
      ],
    })
  } else {
    app.tray.remove()
  }

  app.launchAtLogin.set(s.launchAtLogin).catch(() => {})
}

/**
 * Brings the main window forward and asks it to run a command.
 * @param app - The tinyjs app handle.
 * @param command - Frontend command id, e.g. 'newNote'.
 */
function command(app: TinyApp, command: string): void {
  app.show()
  app.push('command', command)
}

export const api = {
  /** @return Every note summary. */
  listNotes: async () => (await ready, notes.list()),
  /**
   * @param p - `id` of the note to load.
   * @return The full note, or null.
   */
  getNote: async (p: { id: string }) => (await ready, notes.get(p.id)),
  /**
   * @param p - Optional starting Markdown.
   * @param app - The tinyjs app handle.
   * @return The new note.
   */
  createNote: async (p: { markdown?: string }, app: TinyApp) => {
    await ready
    const note = notes.create(Date.now(), p?.markdown ?? '')
    changed(app)
    return note
  },
  /**
   * @param p - Note id with its new TipTap JSON and Markdown.
   * @param app - The tinyjs app handle.
   * @return False if the note was deleted meanwhile.
   */
  saveNote: async (p: NotePatch, app: TinyApp) => {
    await ready
    const ok = notes.save(p, Date.now())
    changed(app)
    return ok
  },
  /**
   * @param p - `id` of the note to archive.
   * @param app - The tinyjs app handle.
   */
  archiveNote: async (p: { id: string }, app: TinyApp) => {
    await ready
    notes.archive(p.id, Date.now())
    changed(app)
    sweep(app)
  },
  /**
   * @param p - `id` of the note whose archive to undo.
   * @param app - The tinyjs app handle.
   */
  unarchiveNote: async (p: { id: string }, app: TinyApp) => {
    await ready
    notes.unarchive(p.id)
    changed(app)
    sweep(app)
  },
  /**
   * @param p - `id` of the archived note to restore.
   * @param app - The tinyjs app handle.
   */
  restoreNote: async (p: { id: string }, app: TinyApp) => {
    await ready
    notes.restore(p.id, Date.now())
    changed(app)
    sweep(app)
  },
  /**
   * @param p - Note `id` and the epoch ms it should return to Review.
   * @param app - The tinyjs app handle.
   */
  keepNote: async (p: { id: string; until: number }, app: TinyApp) => {
    await ready
    notes.keep(p.id, p.until)
    changed(app)
    sweep(app)
  },
  /**
   * @param p - `id` of the note to delete permanently.
   * @param app - The tinyjs app handle.
   */
  deleteNote: async (p: { id: string }, app: TinyApp) => {
    await ready
    notes.remove(p.id)
    changed(app)
    sweep(app)
  },
  /**
   * @param _p - Unused.
   * @param app - The tinyjs app handle.
   * @return How many notes were deleted.
   */
  emptyArchive: async (_p: unknown, app: TinyApp) => {
    await ready
    const n = notes.emptyArchive()
    changed(app)
    return n
  },
  /**
   * @param p - The search text.
   * @return Matching notes with snippets.
   */
  search: async (p: { query: string }) => (await ready, notes.search(p.query)),
  /** @return The current settings. */
  getSettings: async () => (await ready, settings.get()),
  /**
   * @param p - Settings to change.
   * @param app - The tinyjs app handle.
   * @return The settings after the change.
   */
  updateSettings: async (p: Partial<Settings>, app: TinyApp) => {
    await ready
    const next = settings.update(p)
    applySystem(app, next)
    sweep(app)
    app.push('settings-changed', next)
    return next
  },
  /**
   * @param p - Destination folder.
   * @return How many files were written.
   */
  exportAll: async (p: { dir: string }) => (await ready, exportNotes(p.dir, notes.list())),
  /**
   * @param p - Frontend command to run in the main window.
   * @param app - The tinyjs app handle.
   */
  command: async (p: { command: string }, app: TinyApp) => command(app, p.command),
  /**
   * @param p - Id of the window to bring forward.
   * @param app - The tinyjs app handle.
   */
  showWindow: async (p: { id: string }, app: TinyApp) => app.window(p.id).show(),
}

export type Api = typeof api

/**
 * Boots storage, applies system settings and starts the lifecycle sweep.
 * @param app - The tinyjs app handle.
 */
export function init(app: TinyApp): void {
  app.setHideOnClose(true)
  ready = boot(app)
  ready.then(() => {
    applySystem(app, settings.get())
    sweep(app)
    setInterval(() => sweep(app), SWEEP_MS)
  })
}

/**
 * Global hotkey pressed while any app is frontmost.
 * @param id - Hotkey id.
 * @param app - The tinyjs app handle.
 */
export function onHotkey(id: string, app: TinyApp): void {
  if (id === 'quickCapture') command(app, 'quickCapture')
}

/**
 * Menu bar icon menu item chosen.
 * @param id - Menu item id, or null for a bare icon click.
 * @param app - The tinyjs app handle.
 */
export function onTray(id: string | null, app: TinyApp): void {
  if (id === 'new') command(app, 'newNote')
  else if (id === 'review') command(app, 'review')
  else if (id === 'quit') app.quit()
  else app.show()
}

/**
 * App menu item chosen.
 * @param id - Menu item id.
 * @param app - The tinyjs app handle.
 */
export function onMenu(id: string, app: TinyApp): void {
  command(app, id)
}

/**
 * Re-checks staleness on wake, since timers don't run while the Mac sleeps.
 * @param kind - 'theme', 'sleep' or 'wake'.
 * @param _value - Unused.
 * @param app - The tinyjs app handle.
 */
export function onSystem(kind: string, _value: unknown, app: TinyApp): void {
  if (kind === 'wake') {
    sweep(app)
    changed(app)
  }
}
