import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DAY } from '@/shared/time'
import type { NoteSummary } from '@/shared/types'

const state = vi.hoisted(() => ({ notes: [] as NoteSummary[], calls: [] as [string, unknown][] }))

vi.mock('@/lib/api', () => ({
  call: vi.fn(async (method: string, params?: { id?: string; until?: number }) => {
    state.calls.push([method, params])
    if (method === 'listNotes') return state.notes
    if (method === 'getNote') return { ...state.notes.find((n) => n.id === params?.id), doc: '' }
    if (method === 'archiveNote') state.notes = state.notes.filter((n) => n.id !== params?.id)
    if (method === 'keepNote') state.notes = state.notes.map((n) => (n.id === params?.id ? { ...n, keptUntil: params.until! } : n))
    return null
  }),
  on: vi.fn(),
}))

const { useNotes } = await import('@/composables/useNotes')
const { useView } = await import('@/composables/useView')
const ReviewView = (await import('@/components/review/ReviewView.vue')).default

const note = (id: string, title: string, ageDays: number): NoteSummary => ({
  id,
  title,
  markdown: `${title}\n- [x] done`,
  preview: `${title} preview`,
  words: 3,
  createdAt: Date.now() - (ageDays + 2) * DAY,
  updatedAt: Date.now() - ageDays * DAY,
  keptUntil: null,
  archivedAt: null,
})

/**
 * Presses a key on the window.
 * @param code - KeyboardEvent code.
 * @param key - KeyboardEvent key.
 */
function press(code: string, key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }))
}

describe('ReviewView', () => {
  beforeEach(async () => {
    state.notes = [note('a', 'Newer', 10), note('b', 'Oldest', 16), note('c', 'Fresh', 1)]
    state.calls = []
    useView().view.value = 'review'
    await useNotes().refresh()
  })

  it('walks stale notes oldest first with E, S and K', async () => {
    const w = mount(ReviewView, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Review · 1 of 2')
    expect(w.find('h2').text()).toBe('Oldest')
    expect(w.text()).toContain('Up next')

    press('KeyS', 's')
    await flushPromises()
    expect(w.text()).toContain('Review · 2 of 2')
    expect(w.find('h2').text()).toBe('Newer')

    press('KeyK', 'k')
    await flushPromises()
    expect(state.calls.some(([m]) => m === 'keepNote')).toBe(true)
    expect(w.text()).toContain('All caught up.')
    expect(w.text()).toContain('You skipped one note')
    w.unmount()
  })

  it('archives with E and stays in Review', async () => {
    const w = mount(ReviewView, { attachTo: document.body })
    await flushPromises()
    press('KeyE', 'e')
    await flushPromises()
    expect(state.calls.find(([m]) => m === 'archiveNote')?.[1]).toEqual({ id: 'b' })
    expect(useView().view.value).toBe('review')
    expect(w.find('h2').text()).toBe('Newer')
    w.unmount()
  })
})
