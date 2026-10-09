import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useShortcuts } from '@/composables/useShortcuts'
import { useView } from '@/composables/useView'
import { on } from '@/lib/api'
import { openSettings } from '@/lib/windows'
import { eventInitFor, NEW_NOTE_WITH_TEXT } from '@/lib/palette/palette'
import { routesToToast } from '@/lib/shell/undo'

type EditorHandle = { focus: () => void; flush?: () => void | Promise<void> }

/**
 * Main-window commands, shared by shortcuts, the ⌘K palette, the app menu and backend pushes.
 * @param editor - The editor pane, focused after creating a note and flushed before archiving.
 * @return `run`, which executes a command by id.
 */
export function useAppCommands(editor: Ref<EditorHandle | null>) {
  const notes = useNotes()
  const { shortcuts } = useSettings()
  const { view, sidebarOpen, paletteOpen, toast } = useView()

  /**
   * Creates a note and puts the caret in it.
   * @param markdown - Starting text.
   */
  async function createAndFocus(markdown = ''): Promise<void> {
    paletteOpen.value = false
    await editor.value?.flush?.()
    await notes.refresh()
    await notes.create(markdown)
    await nextTick()
    editor.value?.focus()
  }

  /** Asks before permanently deleting the open note. */
  async function deleteCurrent(): Promise<void> {
    const note = notes.current.value
    if (view.value !== 'editor' || !note) return
    const ok = await tiny.dialog.confirm(`Delete “${note.title || 'Untitled'}”?`, {
      detail: 'This can’t be undone.',
      ok: 'Delete',
    })
    if (ok) await notes.remove(note.id)
  }

  /** Archives the open note, saving pending edits first so they aren't lost or written after the archive. */
  async function archiveCurrent(): Promise<void> {
    const id = notes.currentId.value
    if (view.value !== 'editor' || !id) return
    await editor.value?.flush?.()
    await notes.archive(id)
  }

  /**
   * Switches the main pane.
   * @param next - The view to show.
   */
  function show(next: 'review' | 'archive'): void {
    paletteOpen.value = false
    view.value = next
  }

  const handlers: Record<string, () => unknown> = {
    newNote: () => createAndFocus(),
    archiveNote: archiveCurrent,
    deleteNote: deleteCurrent,
    prevNote: () => notes.step(-1),
    nextNote: () => notes.step(1),
    search: () => (paletteOpen.value = !paletteOpen.value),
    toggleSidebar: () => (sidebarOpen.value = !sidebarOpen.value),
    review: () => show('review'),
    archive: () => show('archive'),
    settings: () => openSettings(),
  }

  useShortcuts(handlers)

  /**
   * Runs a command by id. Ids without a handler here are replayed as their shortcut, for ones other panes own.
   * @param id - Shortcut id, menu id, backend command or 'newNoteWithText'.
   * @param text - Starting text for 'newNoteWithText'.
   */
  function run(id: string, text?: string): void {
    if (id === NEW_NOTE_WITH_TEXT) return void createAndFocus(text)
    if (id === 'quickCapture') return void createAndFocus()
    const fn = handlers[id]
    if (fn) return void fn()
    const combo = shortcuts.value[id]
    if (combo) window.dispatchEvent(new KeyboardEvent('keydown', eventInitFor(combo)))
  }

  /**
   * ⌘Z undoes the toast's action (an archive) instead of reaching the editor.
   * @param e - The keydown event.
   */
  function onUndo(e: KeyboardEvent): void {
    if (!routesToToast(e, toast.value)) return
    e.preventDefault()
    e.stopPropagation()
    const action = toast.value!.action!
    toast.value = null
    action.run()
  }

  /**
   * Esc leaves Review or Archive for the editor, unless something inside already handled it.
   * @param e - The keydown event.
   */
  function onEscape(e: KeyboardEvent): void {
    if (e.key !== 'Escape' || e.defaultPrevented || paletteOpen.value || view.value === 'editor') return
    view.value = 'editor'
  }

  let off: (() => void) | undefined
  onMounted(() => {
    window.addEventListener('keydown', onUndo, { capture: true })
    window.addEventListener('keydown', onEscape)
    off = on<string>('command', (id) => run(id))
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onUndo, { capture: true })
    window.removeEventListener('keydown', onEscape)
    off?.()
  })

  return { run, createAndFocus }
}
