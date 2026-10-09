import { describe, expect, it } from 'vitest'
import { parseDoc } from '@/lib/review/doc'

describe('note document', () => {
  it('uses stored TipTap JSON when valid', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] }
    expect(parseDoc(JSON.stringify(doc), 'ignored')).toEqual(doc)
  })

  it('falls back to Markdown', () => {
    const doc = parseDoc('', '# Title\n- [x] done\n- [ ] todo\n- a\n1. one\n> quote\n```\ncode\n```\n---\ntext')
    expect(doc.content?.map((n) => n.type)).toEqual([
      'heading',
      'taskList',
      'bulletList',
      'orderedList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'paragraph',
    ])
    expect(doc.content?.[1].content?.map((n) => n.attrs?.checked)).toEqual([true, false])
  })
})
