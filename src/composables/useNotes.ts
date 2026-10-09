import { computed, ref } from 'vue'
import { call, on } from '../lib/api'
import { isBlank } from '../lib/notes/blank'
import { groupOf, reviewQueue, type Group } from '../shared/lifecycle'
import type { Note, NoteSummary } from '../shared/types'
import { useClock } from './useClock'
import { useSettings } from './useSettings'
import { useView } from './useView'

const notes = ref<NoteSummary[]>([])
const currentId = ref<string | null>(null)
const current = ref<Note | null>(null)
const archiveUndo: string[] = []
let loaded: Promise<void> | null = null

/**
 * Re-reads the note list from the backend.
 * @return Resolves when the list is fresh.
 */
async function refresh(): Promise<void> {
  notes.value = await call('listNotes')
}

/**
 * Shared note list, current note and every lifecycle action.
 * @return Reactive notes, derived groups and actions.
 */
export function useNotes() {
  const { settings } = useSettings()
  const { now } = useClock()
  const { view, showToast } = useView()

  const active = computed(() => notes.value.filter((n) => n.archivedAt === null))
  const archived = computed(() =>
    notes.value.filter((n) => n.archivedAt !== null).sort((a, b) => b.archivedAt! - a.archivedAt!),
  )
  const groups = computed(() => {
    const out: Record<Exclude<Group, 'archived'>, NoteSummary[]> = { today: [], week: [], earlier: [], stale: [] }
    for (const n of active.value) {
      const g = groupOf(n, settings.value.staleDays, now.value)
      if (g !== 'archived') out[g].push(n)
    }
    out.stale.sort((a, b) => a.updatedAt - b.updatedAt)
    return out
  })
  const queue = computed(() => reviewQueue(active.value, settings.value.staleDays, now.value))
  /** Active notes in sidebar order, for previous/next navigation. */
  const ordered = computed(() => [
    ...groups.value.today,
    ...groups.value.week,
    ...groups.value.earlier,
    ...groups.value.stale,
  ])

  /**
   * Loads the note list once, opens the most recent note and follows backend changes.
   * @return Resolves when notes are loaded.
   */
  function load(): Promise<void> {
    loaded ??= refresh().then(() => {
      on('notes-changed', refresh)
      const first = ordered.value[0]
      if (first) return open(first.id)
    })
    return loaded
  }

  /**
   * Opens a note in the editor.
   * @param id - Note id.
   * @return Resolves when the note is loaded.
   */
  async function open(id: string): Promise<void> {
    view.value = 'editor'
    await select(id)
  }

  /**
   * Makes a note current without changing the view.
   * @param id - Note id.
   * @return Resolves when the note is loaded.
   */
  async function select(id: string): Promise<void> {
    currentId.value = id
    const note = await call('getNote', { id })
    if (currentId.value === id) current.value = note
  }

  /**
   * Creates a note and opens it. A blank request reuses an existing blank note instead of adding another.
   * @param markdown - Optional starting text.
   * @return The new (or reused) note.
   */
  async function create(markdown = ''): Promise<Note> {
    const blank = markdown ? null : active.value.find((n) => isBlank(n.markdown))
    if (blank) {
      if (currentId.value !== blank.id || view.value !== 'editor') await open(blank.id)
      if (current.value) return current.value
    }
    const note = await call('createNote', { markdown })
    await refresh()
    currentId.value = note.id
    current.value = note
    view.value = 'editor'
    return note
  }

  /**
   * Saves editor content for a note.
   * @param id - Note id.
   * @param doc - TipTap JSON, serialised.
   * @param markdown - The same content as Markdown.
   */
  async function save(id: string, doc: string, markdown: string): Promise<void> {
    await call('saveNote', { id, doc, markdown })
  }

  /**
   * Picks the note to show after the current one leaves the list.
   * @param id - The note that is leaving.
   * @return The neighbouring note id, or null if none remain.
   */
  function neighbour(id: string): string | null {
    const list = ordered.value
    const i = list.findIndex((n) => n.id === id)
    return (list[i + 1] ?? list[i - 1])?.id ?? null
  }

  /**
   * Archives a note, with a toast offering Undo; ⌘Z also undoes it.
   * @param id - Note id.
   */
  async function archive(id: string): Promise<void> {
    const next = currentId.value === id ? neighbour(id) : currentId.value
    const title = notes.value.find((n) => n.id === id)?.title || 'Untitled'
    await call('archiveNote', { id })
    archiveUndo.push(id)
    await refresh()
    if (currentId.value === id) {
      if (next) await select(next)
      else ((currentId.value = null), (current.value = null))
    }
    showToast(`Archived “${title}”`, { label: 'Undo', run: () => undoArchive() })
  }

  /**
   * Undoes the most recent archive and reopens that note.
   * @return True if there was an archive to undo.
   */
  async function undoArchive(): Promise<boolean> {
    const id = archiveUndo.pop()
    if (!id) return false
    await call('unarchiveNote', { id })
    await refresh()
    await open(id)
    return true
  }

  /**
   * Restores an archived note and opens it.
   * @param id - Note id.
   */
  async function restore(id: string): Promise<void> {
    await call('restoreNote', { id })
    await refresh()
    showToast('Restored')
  }

  /**
   * Keeps a stale note out of Review until a date.
   * @param id - Note id.
   * @param until - When it returns, in epoch ms.
   */
  async function keep(id: string, until: number): Promise<void> {
    await call('keepNote', { id, until })
    await refresh()
  }

  /**
   * Permanently deletes a note.
   * @param id - Note id.
   */
  async function remove(id: string): Promise<void> {
    const next = currentId.value === id ? neighbour(id) : null
    await call('deleteNote', { id })
    await refresh()
    if (currentId.value === id) {
      if (next) await select(next)
      else ((currentId.value = null), (current.value = null))
    }
  }

  /**
   * Permanently deletes every archived note.
   * @return How many were deleted.
   */
  async function emptyArchive(): Promise<number> {
    const n = await call('emptyArchive')
    await refresh()
    return n
  }

  /**
   * Opens the previous or next note in sidebar order.
   * @param step - -1 for previous, 1 for next.
   */
  async function step(step: -1 | 1): Promise<void> {
    const list = ordered.value
    if (!list.length) return
    const i = list.findIndex((n) => n.id === currentId.value)
    const target = list[Math.min(list.length - 1, Math.max(0, i + step))]
    if (target) await open(target.id)
  }

  return {
    notes,
    active,
    archived,
    groups,
    queue,
    ordered,
    currentId,
    current,
    load,
    refresh,
    open,
    create,
    save,
    archive,
    undoArchive,
    restore,
    keep,
    remove,
    emptyArchive,
    step,
  }
}
