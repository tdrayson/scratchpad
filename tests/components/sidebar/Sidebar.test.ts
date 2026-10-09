import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DAY } from '@/shared/time'
import type { NoteSummary } from '@/shared/types'

const state = vi.hoisted(() => ({ notes: [] as NoteSummary[] }))

vi.mock('@/lib/api', () => ({
  call: vi.fn(async (method: string) => (method === 'listNotes' ? state.notes : null)),
  on: vi.fn(),
}))

const { useNotes } = await import('@/composables/useNotes')
const { useView } = await import('@/composables/useView')
const Sidebar = (await import('@/components/sidebar/Sidebar.vue')).default

const note = (id: string, ageDays: number, archived = false): NoteSummary => ({
  id,
  title: id,
  markdown: id,
  preview: '',
  words: 1,
  createdAt: Date.now() - ageDays * DAY,
  updatedAt: Date.now() - ageDays * DAY,
  keptUntil: null,
  archivedAt: archived ? Date.now() : null,
})

/**
 * Loads notes and mounts the sidebar.
 * @param notes - Notes the backend returns.
 * @return The wrapper.
 */
async function mountWith(notes: NoteSummary[]) {
  state.notes = notes
  await useNotes().refresh()
  return mount(Sidebar)
}

describe('Sidebar', () => {
  beforeEach(() => {
    useView().view.value = 'editor'
  })

  it('hides Review and Archive when both are empty', async () => {
    const w = await mountWith([note('fresh', 0)])
    expect(w.text()).not.toContain('Review')
    expect(w.text()).not.toContain('Archive')
  })

  it('shows each one once it has notes', async () => {
    const w = await mountWith([note('fresh', 0), note('old', 30, true)])
    expect(w.text()).not.toContain('Review')
    expect(w.text()).toContain('Archive')
  })

  it('keeps an empty item while its view is open', async () => {
    useView().view.value = 'review'
    const w = await mountWith([note('fresh', 0)])
    expect(w.text()).toContain('Review')
  })
})
