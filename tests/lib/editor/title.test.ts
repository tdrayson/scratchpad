import { Editor } from '@tiptap/vue-3'
import { afterEach, describe, expect, it } from 'vitest'
import { EMPTY_DOC, editorExtensions } from '@/lib/editor/extensions'

let editor: Editor | undefined

afterEach(() => editor?.destroy())

/**
 * A headless editor with the caret at the end of the title.
 * @param content - Starting document.
 * @return The editor.
 */
function make(content: object | string = EMPTY_DOC): Editor {
  editor = new Editor({ extensions: editorExtensions(undefined, true), content })
  editor.commands.setTextSelection(1)
  return editor
}

/**
 * Simulates pressing Enter through the editor's keymaps.
 * @param e - The editor.
 * @return Whether a handler consumed the key.
 */
function pressEnter(e: Editor): boolean {
  const event = new KeyboardEvent('keydown', { key: 'Enter' })
  return e.view.someProp('handleKeyDown', (f) => f(e.view, event)) ?? false
}

describe('title guard', () => {
  it('blocks Enter on an empty title', () => {
    const e = make()
    const before = e.state.doc.childCount
    expect(pressEnter(e)).toBe(true)
    expect(e.state.doc.childCount).toBe(before)
  })

  it('allows Enter once the title has text', () => {
    const e = make()
    e.commands.insertContent('Groceries')
    const before = e.state.doc.childCount
    pressEnter(e)
    expect(e.state.doc.childCount).toBe(before + 1)
  })

  it('turns a non-heading first block into the H1 title', () => {
    const e = make('<p>Plain first line</p><p>Body</p>')
    e.commands.insertContent('x')
    const first = e.state.doc.firstChild!
    expect(first.type.name).toBe('heading')
    expect(first.attrs.level).toBe(1)
  })
})
