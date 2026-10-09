import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ShortcutRecorder from '../ShortcutRecorder.vue'

/**
 * Dispatches a keydown on the window, as a real key press reaches the recorder.
 * @param code - Physical key code, e.g. 'KeyJ'.
 * @param key - Logical key value.
 * @param mods - Modifier flags.
 */
function press(code: string, key: string, mods: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, ...mods }))
}

/**
 * Mounts a recorder for the newNote shortcut, starts recording.
 * @return The wrapper.
 */
async function recording() {
  const w = mount(ShortcutRecorder, {
    attachTo: document.body,
    props: { id: 'newNote', modelValue: 'cmd+n', 'onUpdate:modelValue': () => {} },
  })
  await w.get('button').trigger('click')
  return w
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ShortcutRecorder', () => {
  it('records the next combo', async () => {
    const w = await recording()
    expect(w.text()).toContain('Press keys')
    press('MetaLeft', 'Meta', { metaKey: true })
    press('KeyJ', 'j', { metaKey: true })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['cmd+j'])
  })

  it('clears on bare Backspace', async () => {
    const w = await recording()
    press('Backspace', 'Backspace')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('rejects a conflict and says which shortcut owns it', async () => {
    const w = await recording()
    press('KeyK', 'k', { metaKey: true })
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.get('[role="alert"]').text()).toBe('Used by “Search”')
  })

  it('rejects reserved and modifier-less combos, and Esc cancels', async () => {
    const w = await recording()
    press('KeyQ', 'q', { metaKey: true })
    await w.vm.$nextTick()
    expect(w.get('[role="alert"]').text()).toBe('Reserved by macOS')
    press('KeyJ', 'j')
    await w.vm.$nextTick()
    expect(w.get('[role="alert"]').text()).toBe('Needs a modifier key')
    press('Escape', 'Escape')
    await w.vm.$nextTick()
    expect(w.text()).not.toContain('Press keys')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
