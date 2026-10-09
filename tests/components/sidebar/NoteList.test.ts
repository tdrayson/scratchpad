import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteList from '@/components/sidebar/NoteList.vue'
import { sidebarSections } from '@/lib/sidebar/sections'
import { DAY } from '@/shared/time'
import type { NoteSummary } from '@/shared/types'

const now = new Date(2026, 9, 9, 15, 0).getTime()
const note = (id: string, title: string, ageDays = 0) =>
  ({ id, title, preview: `${title} preview`, updatedAt: now - ageDays * DAY }) as NoteSummary

const groups = {
  today: [note('a', 'Travel'), note('b', '')],
  week: [],
  earlier: [],
  stale: [note('c', 'Compromised', 12)],
}

/**
 * Mounts the list attached to the document so focus works.
 * @return The wrapper.
 */
function mountList() {
  return mount(NoteList, { props: { sections: sidebarSections(groups), selectedId: 'b', now }, attachTo: document.body })
}

describe('NoteList', () => {
  it('renders only non-empty sections with stale ages in orange', () => {
    const w = mountList()
    expect(w.text()).toContain('Today')
    expect(w.text()).not.toContain('This week')
    expect(w.text()).toContain('1 to review')
    expect(w.text()).toContain('Untitled')
    const stale = w.findAll('[data-row]')[2]
    expect(stale.find('.text-stale').text()).toBe('12d')
    w.unmount()
  })

  it('makes the selected row the tab stop, moves with arrows and opens on click', async () => {
    const w = mountList()
    const rows = w.findAll('[data-row]')
    expect(rows.map((r) => r.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    ;(rows[1].element as HTMLElement).focus()
    await rows[1].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(rows[2].element)
    await rows[2].trigger('click')
    expect(w.emitted('open')?.[0]).toEqual(['c'])
    w.unmount()
  })
})
