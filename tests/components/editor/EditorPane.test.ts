import { flushPromises, mount } from '@vue/test-utils'
import type { Editor } from '@tiptap/vue-3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note } from '@/shared/types'

const call = vi.fn(async (_method: string, _params?: unknown): Promise<unknown> => [])
vi.mock('@/lib/api', () => ({ call: (m: string, p?: unknown) => call(m, p), on: () => () => {} }))

const write = vi.fn()
vi.stubGlobal('tiny', { clipboard: { write } })

const { default: EditorPane } = await import('@/components/editor/EditorPane.vue')
const { useNotes } = await import('@/composables/useNotes')

/**
 * A note with the given Markdown.
 * @param id - Note id.
 * @param markdown - Its content.
 * @return The note.
 */
const note = (id: string, markdown: string): Note => ({
  id,
  title: markdown.split('\n')[0].replace(/^#+\s*/, ''),
  doc: '',
  markdown,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  keptUntil: null,
  archivedAt: null,
})

/**
 * The TipTap editor behind the pane's ProseMirror view.
 * @param w - The mounted pane.
 * @return The editor.
 */
function editorOf(w: ReturnType<typeof mount>): Editor {
  return (w.find('.ProseMirror').element as HTMLElement & { editor: Editor }).editor
}

/**
 * Types into the note's last (trailing, empty) paragraph.
 * @param w - The mounted pane.
 * @param text - Text to type.
 */
function typeAtEnd(w: ReturnType<typeof mount>, text: string): void {
  const ed = editorOf(w)
  ed.chain().setTextSelection(ed.state.doc.content.size - 1).insertContent(text).run()
}

/**
 * Opens a note in the shared notes state, as useNotes().open would.
 * @param n - The note.
 */
async function openNote(n: Note | null): Promise<void> {
  const { current, currentId } = useNotes()
  currentId.value = n?.id ?? null
  current.value = n
  await flushPromises()
}

/**
 * The saveNote calls made so far.
 * @return Their params.
 */
const saves = () => call.mock.calls.filter(([m]) => m === 'saveNote').map(([, p]) => p as { id: string; markdown: string })

describe('EditorPane', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    call.mockClear()
    write.mockClear()
  })
  afterEach(async () => {
    await openNote(null)
    vi.useRealTimers()
  })

  it('loads a note without saving it', async () => {
    await openNote(note('a', '# Alpha\n\nbody'))
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    expect(w.find('h1').text()).toBe('Alpha')
    vi.advanceTimersByTime(1000)
    expect(saves()).toEqual([])
    w.unmount()
  })

  it('debounces edits into the note they were made in, flushing on switch', async () => {
    await openNote(note('a', '# Alpha'))
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    typeAtEnd(w, 'edited a')
    expect(saves()).toEqual([])

    await openNote(note('b', '# Beta'))
    expect(saves()).toHaveLength(1)
    expect(saves()[0]).toMatchObject({ id: 'a', markdown: '# Alpha\n\nedited a' })
    expect(w.find('h1').text()).toBe('Beta')

    vi.advanceTimersByTime(1000)
    expect(saves()).toHaveLength(1)

    typeAtEnd(w, 'edited b')
    vi.advanceTimersByTime(400)
    expect(saves()[1]).toMatchObject({ id: 'b', markdown: '# Beta\n\nedited b' })
    w.unmount()
  })

  it('flushes a pending save on unmount and window blur', async () => {
    await openNote(note('a', '# Alpha'))
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    typeAtEnd(w, 'one')
    window.dispatchEvent(new Event('blur'))
    expect(saves()).toHaveLength(1)
    typeAtEnd(w, 'two')
    w.unmount()
    expect(saves()[1]).toMatchObject({ id: 'a', markdown: '# Alpha\n\nonetwo' })
  })

  it('starts an empty note with an empty title line', async () => {
    await openNote(note('a', ''))
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    expect(w.find('h1').exists()).toBe(true)
    w.unmount()
  })

  it('copies the whole note as Markdown', async () => {
    await openNote(note('a', '# Alpha\n\n- one'))
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    await w.findAll('button').find((b) => b.text() === 'Copy Markdown')!.trigger('click')
    expect(write).toHaveBeenCalledWith({ text: '# Alpha\n\n- one' })
    w.unmount()
  })

  it('shows the empty state with no note', async () => {
    const w = mount(EditorPane, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('No note open')
    expect(w.text()).toContain('New note')
    w.unmount()
  })
})
