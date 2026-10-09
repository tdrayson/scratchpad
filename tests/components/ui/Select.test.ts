import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Select from '@/components/ui/Select.vue'

const options = [
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'sunset', label: 'Sunset', detail: '18:41' },
  { value: 'fixed', label: 'Fixed time' },
]

const flush = async () => {
  await nextTick()
  await nextTick()
}

/**
 * Sends a keydown to the element that currently has focus.
 * @param key - The key name.
 */
function press(key: string): void {
  document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/**
 * Mounts a Select bound to 'sunrise'.
 * @return The wrapper.
 */
function mountSelect() {
  return mount(Select<string>, {
    attachTo: document.body,
    props: { options, label: 'Anchor', modelValue: 'sunrise', 'onUpdate:modelValue': () => {} },
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Select', () => {
  it('opens on ArrowDown with the current value focused, then picks with arrows and Enter', async () => {
    const w = mountSelect()
    await w.get('button').trigger('keydown', { key: 'ArrowDown' })
    await flush()
    expect(document.activeElement?.textContent).toContain('Sunrise')
    press('ArrowDown')
    press('Enter')
    await flush()
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['sunset'])
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(w.get('button').element)
  })

  it('jumps by type-ahead and closes on Escape without changing', async () => {
    const w = mountSelect()
    await w.get('button').trigger('click')
    await flush()
    press('f')
    expect(document.activeElement?.textContent).toContain('Fixed time')
    press('Escape')
    await flush()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
