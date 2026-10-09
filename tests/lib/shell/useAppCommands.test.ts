import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

vi.mock('@/lib/api', () => ({ call: vi.fn(async () => []), on: vi.fn(() => () => {}) }))

const hide = vi.fn(async (_opts?: { app: boolean }) => {})
;(globalThis as unknown as { tiny: unknown }).tiny = { win: { hide } }

const { useAppCommands } = await import('@/lib/shell/useAppCommands')

describe('useAppCommands', () => {
  it('⌘W saves pending edits, then hides the app, even from inside the editor', async () => {
    const order: string[] = []
    hide.mockImplementation(async () => void order.push('hide'))
    const flush = vi.fn(async () => void order.push('flush'))
    const Host = defineComponent({
      setup() {
        useAppCommands(ref({ focus: () => {}, flush }))
        return () => h('div', { contenteditable: 'true' })
      },
    })
    const w = mount(Host, { attachTo: document.body })
    const ev = new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', metaKey: true, bubbles: true, cancelable: true })
    w.element.dispatchEvent(ev)
    await flushPromises()
    expect(ev.defaultPrevented).toBe(true)
    expect(order).toEqual(['flush', 'hide'])
    w.unmount()
  })
})
