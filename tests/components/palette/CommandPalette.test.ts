import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

vi.mock('@/lib/api', () => ({
  call: vi.fn(async (method: string) =>
    method === 'search'
      ? [{ note: { id: 'x', title: 'Travel', archivedAt: null, updatedAt: Date.now() }, snippet: 'the \u0001currency\u0002' }]
      : [],
  ),
  on: vi.fn(),
}))

const { default: CommandPalette } = await import('@/components/palette/CommandPalette.vue')

afterEach(() => (document.body.innerHTML = ''))

describe('CommandPalette', () => {
  it('searches, highlights matches and runs New note with ⌘↵', async () => {
    vi.useFakeTimers()
    const w = mount(CommandPalette, { attachTo: document.body })
    const input = document.querySelector('input')!
    input.value = 'currency'
    input.dispatchEvent(new Event('input'))
    await vi.advanceTimersByTimeAsync(100)
    await flushPromises()
    expect(document.body.textContent).toContain('1 match')
    expect(document.querySelector('.text-accent')?.textContent).toBe('currency')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }))
    await nextTick()
    expect(w.emitted('action')?.[0]).toEqual(['newNoteWithText', 'currency'])
    vi.useRealTimers()
    w.unmount()
  })

  it('moves selection with arrows and runs an action with Enter', async () => {
    const w = mount(CommandPalette, { attachTo: document.body })
    const input = document.querySelector('input')!
    input.value = 'start review'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(document.querySelector('[aria-selected="true"]')?.textContent).toContain('Start review')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(w.emitted('action')?.[0]).toEqual(['review', undefined])
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })
})
