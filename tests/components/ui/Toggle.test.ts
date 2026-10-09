import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Toggle from '@/components/ui/Toggle.vue'

describe('Toggle', () => {
  it('flips v-model and reflects it as a switch', async () => {
    const w = mount(Toggle, { props: { modelValue: false, 'onUpdate:modelValue': (v: boolean) => w.setProps({ modelValue: v }) } })
    const btn = w.get('[role="switch"]')
    expect(btn.attributes('aria-checked')).toBe('false')
    await btn.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(btn.attributes('aria-checked')).toBe('true')
  })
})
