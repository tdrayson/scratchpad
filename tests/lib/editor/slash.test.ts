import { Editor } from '@tiptap/vue-3'
import { afterEach, describe, expect, it } from 'vitest'
import { editorExtensions } from '@/lib/editor/extensions'
import { slashAllowed } from '@/lib/editor/slash'

let editor: Editor | undefined

afterEach(() => editor?.destroy())

describe('slashAllowed', () => {
  it('opens in the body but not in the title or code', () => {
    editor = new Editor({
      extensions: editorExtensions(undefined, true),
      content: '<h1>Title</h1><p>Body</p><pre><code>x</code></pre>',
    })
    const { doc } = editor.state
    const title = 1
    const body = doc.child(0).nodeSize + 1
    const code = body + doc.child(1).nodeSize
    expect(slashAllowed(doc, title)).toBe(false)
    expect(slashAllowed(doc, body)).toBe(true)
    expect(slashAllowed(doc, code)).toBe(false)
  })
})
