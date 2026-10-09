import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DAY } from '@/shared/time'
import type { NoteSummary } from '@/shared/types'

const state = vi.hoisted(() => ({ notes: [] as NoteSummary[], calls: [] as [string, unknown][] }))

vi.mock('@/lib/api', () => ({
  call: vi.fn(async (method: string, params?: { id?: string }) => {
    state.calls.push([method, params])
    if (method === 'listNotes') return state.notes
    if (method === 'getNote') return { ...state.notes.find((n) => n.id === params?.id), doc: '' }
    if (method === 'deleteNote') state.notes = state.notes.filter((n) => n.id !== params?.id)
    if (method === 'restoreNote') state.notes = state.notes.map((n) => (n.id === params?.id ? { ...n, archivedAt: null } : n))
    if (method === 'emptyArchive') {
      const n = state.notes.filter((x) => x.archivedAt !== null).length
      state.notes = state.notes.filter((x) => x.archivedAt === null)
      return n
    }
    return null
  }),
  on: vi.fn(),
}))

const confirm = vi.fn(async () => true)
;(globalThis as unknown as { tiny: unknown }).tiny = { dialog: { confirm } }

const { useNotes } = await import('@/composables/useNotes')
const { useView } = await import('@/composables/useView')
const ArchiveView = (await import('@/components/archive/ArchiveView.vue')).default

const archived = (id: string, title: string, daysAgo: number): NoteSummary => ({
  id,
  title,
  markdown: title,
  preview: `${title} preview`,
  words: 1,
  createdAt: Date.now() - 40 * DAY,
  updatedAt: Date.now() - 40 * DAY,
  keptUntil: null,
  archivedAt: Date.now() - daysAgo * DAY,
})

/**
 * Presses a key on an element.
 * @param el - Target element.
 * @param init - Key fields.
 */
function press(el: Element, init: KeyboardEventInit): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
}

describe('ArchiveView', () => {
  beforeEach(async () => {
    state.notes = [archived('a', 'FX rates', 9), archived('b', 'Gift voucher', 29)]
    state.calls = []
    confirm.mockClear()
    useView().view.value = 'archive'
    await useNotes().refresh()
  })

  it('lists archived notes with the countdown, orange when close', async () => {
    const w = mount(ArchiveView, { attachTo: document.body, global: { stubs: { TransitionGroup: false } } })
    expect(w.text()).toContain('Archive · 2 notes')
    const rows = w.findAll('li')
    expect(rows[0].text()).toContain('9 days ago')
    expect(rows[0].text()).toContain('21 days')
    expect(rows[1].find('.text-stale').text()).toContain('1 day')
    w.unmount()
  })

  it('moves with arrows, restores with Enter and deletes with ⌘⌫ after confirming', async () => {
    const w = mount(ArchiveView, { attachTo: document.body, global: { stubs: { TransitionGroup: false } } })
    const first = w.findAll('li')[0].element as HTMLElement
    first.focus()
    press(first, { key: 'ArrowDown', code: 'ArrowDown' })
    await flushPromises()
    const second = w.findAll('li')[1].element as HTMLElement
    expect(document.activeElement).toBe(second)

    press(second, { key: 'Backspace', code: 'Backspace', metaKey: true })
    await flushPromises()
    expect(confirm).toHaveBeenCalled()
    expect(state.calls.find(([m]) => m === 'deleteNote')?.[1]).toEqual({ id: 'b' })

    const remaining = w.findAll('li')[0].element as HTMLElement
    remaining.focus()
    press(remaining, { key: 'Enter', code: 'Enter' })
    await flushPromises()
    expect(state.calls.find(([m]) => m === 'restoreNote')?.[1]).toEqual({ id: 'a' })
    expect(useView().view.value).toBe('editor')
    w.unmount()
  })

  it('empties the archive after confirming', async () => {
    const w = mount(ArchiveView, { attachTo: document.body, global: { stubs: { TransitionGroup: false } } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(state.calls.some(([m]) => m === 'emptyArchive')).toBe(true)
    expect(useView().toast.value?.message).toBe('Deleted 2 notes')
    expect(w.text()).toContain('Nothing archived')
    w.unmount()
  })
})
