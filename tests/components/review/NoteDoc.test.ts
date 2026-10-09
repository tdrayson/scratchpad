import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteDoc from '@/components/review/NoteDoc.vue'
import { markdownToDoc } from '@/lib/review/doc'

describe('NoteDoc', () => {
  it('renders checklists with checked state and marks', () => {
    const doc = markdownToDoc('- [x] Ship it\n- [ ] Check Safari')
    doc.content!.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'npm', marks: [{ type: 'code' }, { type: 'bold' }] }],
    })
    const w = mount(NoteDoc, { props: { doc } })
    const items = w.findAll('[role="checkbox"]')
    expect(items.map((i) => [i.attributes('aria-checked'), i.text()])).toEqual([
      ['true', 'Ship it'],
      ['false', 'Check Safari'],
    ])
    expect(w.find('strong code').text()).toBe('npm')
  })
})
