import { Editor } from '@tiptap/vue-3'
import { afterEach, describe, expect, it } from 'vitest'
import { editorExtensions, fromMarkdown as parse, toMarkdown } from '@/lib/editor/extensions'

let editor: Editor | undefined

afterEach(() => editor?.destroy())

/**
 * A headless editor loaded from Markdown.
 * @param md - Starting Markdown.
 * @return The editor.
 */
function fromMarkdown(md: string): Editor {
  editor = new Editor({ extensions: editorExtensions() })
  editor.commands.setContent(parse(editor, md))
  return editor
}

describe('image node', () => {
  it('round-trips a stored image through Markdown', () => {
    const md = '# Trip\n\n![map](scratchpad-image:abc-123)'
    const e = fromMarkdown(md)
    const image = e.getJSON().content?.[1].content?.[0]
    expect(image).toMatchObject({ type: 'image', attrs: { id: 'abc-123', src: null, alt: 'map' } })
    expect(toMarkdown(e)).toBe(md)
  })

  it('keeps a web image link without storing or loading it', () => {
    const md = '# Links\n\n![logo](https://example.com/logo.png)'
    const e = fromMarkdown(md)
    expect(e.getJSON().content?.[1].content?.[0]).toMatchObject({
      attrs: { id: null, src: 'https://example.com/logo.png' },
    })
    expect(toMarkdown(e)).toBe(md)
  })

  it('keeps images inside lists and next to text', () => {
    const md = '# T\n\n- ![a](scratchpad-image:1)\n\nSee ![b](scratchpad-image:2) here'
    expect(toMarkdown(fromMarkdown(md))).toBe(md)
  })

  it('reads its own copied HTML back as the same stored image', () => {
    editor = new Editor({
      extensions: editorExtensions(),
      content: '<h1>T</h1><p><img data-image-id="xyz" alt="a"></p>',
    })
    expect(editor.getJSON().content?.[1].content?.[0]).toMatchObject({ attrs: { id: 'xyz', src: null } })
  })
})
