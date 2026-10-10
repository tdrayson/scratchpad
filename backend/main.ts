import type { Database } from 'tjs:sqlite'
import { isPurgeable, isStale } from '../src/shared/lifecycle'
import { resolveShortcuts } from '../src/shared/shortcuts'
import { startOfDay } from '../src/shared/time'
import type { NotePatch, Settings } from '../src/shared/types'
import { fromBase64, toBase64 } from './lib/base64'
import { openDb } from './lib/db'
import { ImageStore } from './lib/images'
import { NoteStore } from './lib/notes'
import { SettingsStore } from './lib/settings'
import { exportZip, readImport } from './lib/transfer'
import { fetchUpdate } from './lib/updates'
import { IMAGE_SCHEME, MAX_IMAGE_BYTES, rewriteImageLinks } from '../src/shared/images'
import { planImport, type ImportNote } from '../src/shared/transfer'
import { RELEASES_URL } from '../src/shared/updates'

const SWEEP_MS = 60_000
const DAY_MS = 86_400_000
const UPDATE_NOTIFICATION = 'update'

let db: Database
let notes: NoteStore
let settings: SettingsStore
let images: ImageStore
let ready: Promise<void>

/**
 * Opens storage once; every api call awaits it.
 * @param app - The tinyjs app handle.
 */
async function boot(app: TinyApp): Promise<void> {
  db = await openDb(app.paths.data)
  notes = new NoteStore(db)
  settings = new SettingsStore(db)
  images = new ImageStore(db)
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
  images.purgeUnused(now - DAY_MS)

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

  if (s.checkUpdates && settings.meta('updateChecked') !== today) {
    settings.setMeta('updateChecked', today)
    notifyUpdate(app).catch(() => {})
  }
}

/**
 * Background daily check: notifies once per new version; the notification opens the Releases page.
 * @param app - The tinyjs app handle.
 */
async function notifyUpdate(app: TinyApp): Promise<void> {
  const status = await fetchUpdate(app.info.version)
  if (!status.available || settings.meta('updateNotified') === status.latest) return
  settings.setMeta('updateNotified', status.latest)
  app.notify({
    id: UPDATE_NOTIFICATION,
    title: `Scratchpad ${status.latest} is available`,
    body: `You have ${status.current}. Click to open the download page.`,
  })
}

/**
 * Stores an imported note's images and points its links at them.
 * @param noteId - Id the note will be created with.
 * @param note - The planned note.
 * @param now - Time in epoch ms.
 * @return The note's Markdown with stored-image links.
 */
function storeImportedImages(noteId: string, note: ImportNote, now: number): string {
  const ids = new Map<string, string>()
  for (const [src, image] of Object.entries(note.images)) ids.set(src, images.add(noteId, image.mime, image.data, now))
  return rewriteImageLinks(note.markdown, (src) => (ids.has(src) ? IMAGE_SCHEME + ids.get(src) : null))
}

/**
 * Applies the OS-level settings: quick-capture hotkey and launch at login.
 * @param app - The tinyjs app handle.
 * @param s - The current settings.
 */
function applySystem(app: TinyApp, s: Settings): void {
  app.hotkey.unregister('quickCapture')
  const combo = resolveShortcuts(s.shortcuts).quickCapture
  if (s.quickCapture && combo) app.hotkey.register('quickCapture', combo)

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
   * @param p - Folder to save the zip in.
   * @return Where the zip went and how many notes it holds.
   */
  exportNotes: async (p: { dir: string }) => {
    await ready
    return exportZip(p.dir, notes.list(), settings.get().exportArchived, Date.now(), (id) => images.get(id))
  },
  /**
   * @param p - Zips, folders or Markdown files to import.
   * @param app - The tinyjs app handle.
   * @return How many notes were imported, how many of those were archived, and how many duplicates were skipped.
   */
  importNotes: async (p: { paths: string[] }, app: TinyApp) => {
    await ready
    const files = await readImport(p.paths)
    const plan = planImport(files, notes.list().map((n) => n.markdown))
    const now = Date.now()
    notes.insertAll(
      plan.notes.map((n) => {
        const id = crypto.randomUUID()
        return { id, markdown: storeImportedImages(id, n, now), modifiedAt: n.modifiedAt, archivedAt: n.archived ? now : null }
      }),
    )
    if (plan.notes.length) {
      changed(app)
      sweep(app)
    }
    return {
      imported: plan.notes.length,
      archived: plan.notes.filter((n) => n.archived).length,
      skipped: plan.skipped,
    }
  },
  /**
   * @param p - Note it's added to, MIME type and base64 bytes.
   * @return The new image's id.
   */
  addImage: async (p: { noteId: string; mime: string; data: string }) => {
    await ready
    const bytes = fromBase64(p.data)
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Image too large')
    return { id: images.add(p.noteId, p.mime, bytes, Date.now()) }
  },
  /**
   * @param p - Note they're added to and absolute image file paths.
   * @return Ids of the stored images, and how many files weren't images or were too large.
   */
  addImageFiles: async (p: { noteId: string; paths: string[] }) => (await ready, images.addFiles(p.noteId, p.paths, Date.now())),
  /**
   * @param p - Image id.
   * @return The MIME type and base64 bytes, or null if it's gone.
   */
  getImage: async (p: { id: string }) => {
    await ready
    const image = images.get(p.id)
    return image ? { mime: image.mime, data: toBase64(image.data) } : null
  },
  /**
   * @param _p - Unused.
   * @param app - The tinyjs app handle.
   * @return The running and latest versions.
   */
  checkForUpdate: async (_p: unknown, app: TinyApp) => (await ready, fetchUpdate(app.info.version)),
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
 * App menu item chosen.
 * @param id - Menu item id.
 * @param app - The tinyjs app handle.
 */
export function onMenu(id: string, app: TinyApp): void {
  command(app, id)
}

/**
 * Notification clicked; the update one opens the Releases page.
 * @param id - Notification id.
 * @param app - The tinyjs app handle.
 */
export function onNotificationClick(id: string, app: TinyApp): void {
  if (id === UPDATE_NOTIFICATION) app.shell.open(RELEASES_URL).catch(() => {})
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
