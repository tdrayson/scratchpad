import { Editor } from '@tiptap/vue-3'
import { afterEach, describe, expect, it } from 'vitest'
import { selectionData } from '@/lib/editor/clipboard'
import { editorExtensions, toMarkdown } from '@/lib/editor/extensions'

let editor: Editor | undefined

/**
 * A headless editor loaded with Markdown.
 * @param md - Markdown to load.
 * @return The editor.
 */
function load(md: string): Editor {
  editor = new Editor({ extensions: editorExtensions() })
  editor.commands.setContent(md, { contentType: 'markdown' })
  return editor
}

afterEach(() => editor?.destroy())

describe('markdown round-trip', () => {
  const cases: Record<string, string> = {
    h1: '# Title',
    h2: '## Section',
    h3: '### Small',
    paragraph: 'Plain text',
    'inline code': 'On `booking.html` the position',
    bullets: '- one\n- two\n  - nested',
    numbered: '1. one\n2. two',
    checklist: '- [ ] todo\n- [x] done\n  - [ ] nested',
    quote: '> quoted',
    code: '```js\nlet x = 1\n```',
    divider: 'above\n\n---\n\nbelow',
  }

  for (const [name, md] of Object.entries(cases)) {
    it(`keeps ${name}`, () => expect(toMarkdown(load(md))).toBe(md))
  }

  it('keeps a whole note', () => {
    const md = Object.values(cases).join('\n\n')
    expect(toMarkdown(load(md))).toBe(md)
  })

  it('round-trips through TipTap JSON', () => {
    const md = Object.values(cases).join('\n\n')
    const json = load(md).getJSON()
    editor!.destroy()
    editor = new Editor({ extensions: editorExtensions(), content: json })
    expect(toMarkdown(editor)).toBe(md)
  })
})

describe('selectionData', () => {
  it('copies the selection as Markdown and HTML', () => {
    const e = load('# Title\n\n- one\n- two')
    e.commands.selectAll()
    const data = selectionData(e)
    expect(data?.text).toBe('# Title\n\n- one\n- two')
    expect(data?.html).toContain('<li>')
  })

  it('returns null for an empty selection', () => {
    expect(selectionData(load('text'))).toBeNull()
  })
})
