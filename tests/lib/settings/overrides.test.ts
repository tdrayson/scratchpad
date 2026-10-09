import { describe, expect, it } from 'vitest'
import { withOverride, withoutOverrides } from '@/lib/settings/overrides'

describe('shortcut overrides', () => {
  it('stores only combos that differ from the default', () => {
    expect(withOverride({}, 'newNote', 'cmd+shift+n')).toEqual({ newNote: 'cmd+shift+n' })
    expect(withOverride({ newNote: 'cmd+shift+n' }, 'newNote', 'cmd+n')).toEqual({})
  })

  it('keeps a cleared shortcut as an empty override', () => {
    expect(withOverride({}, 'search', '')).toEqual({ search: '' })
  })

  it('leaves other overrides and the input alone', () => {
    const before = { search: 'cmd+p', review: 'cmd+r' }
    expect(withOverride(before, 'search', 'cmd+k')).toEqual({ review: 'cmd+r' })
    expect(before).toEqual({ search: 'cmd+p', review: 'cmd+r' })
  })

  it('resets several shortcuts at once', () => {
    expect(withoutOverrides({ prevNote: 'cmd+up', nextNote: 'cmd+down', search: 'cmd+p' }, ['prevNote', 'nextNote'])).toEqual({
      search: 'cmd+p',
    })
  })
})
