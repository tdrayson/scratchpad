import { describe, expect, it } from 'vitest'
import { routesToToast } from '@/lib/shell/undo'

const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z', ...init })
const undoToast = { id: 1, message: 'Archived', action: { label: 'Undo', run: () => {} } }

describe('routesToToast', () => {
  it('takes ⌘Z when the toast offers Undo', () => {
    expect(routesToToast(key({ metaKey: true }), undoToast)).toBe(true)
  })

  it('lets ⌘Z through to the editor otherwise', () => {
    expect(routesToToast(key({ metaKey: true }), null)).toBe(false)
    expect(routesToToast(key({ metaKey: true }), { id: 2, message: 'Restored' })).toBe(false)
    expect(routesToToast(key({ metaKey: true, shiftKey: true }), undoToast)).toBe(false)
    expect(routesToToast(key({}), undoToast)).toBe(false)
  })
})
