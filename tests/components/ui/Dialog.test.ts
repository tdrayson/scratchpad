import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Dialog from '@/components/ui/Dialog.vue'

describe('Dialog', () => {
  it('focuses the primary button and emits confirm or close', async () => {
    const w = mount(Dialog, {
      props: { title: 'Update', message: 'New version', confirmLabel: 'Download Now', cancelLabel: 'Later' },
      attachTo: document.body,
    })
    expect(document.activeElement?.textContent).toBe('Download Now')
    await w.findAll('button')[1].trigger('click')
    await w.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('confirm')).toHaveLength(1)
    expect(w.emitted('close')).toHaveLength(1)
    w.unmount()
  })

  it('shows a single OK button without a confirm action', () => {
    const w = mount(Dialog, { props: { title: 'Up to date', message: 'All good' } })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['OK'])
  })
})
