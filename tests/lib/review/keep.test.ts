import { describe, expect, it } from 'vitest'
import { keepButtonLabel, keepMenuOptions, parseCustomKeep } from '@/lib/review/keep'
import { keepUntil } from '@/shared/lifecycle'

const now = new Date(2026, 9, 9, 15, 0).getTime()

describe('keep menu', () => {
  it('lists presets with return dates and marks the default', () => {
    const opts = keepMenuOptions(now, 7, 'en-GB')
    expect(opts.map((o) => [o.label, o.detail])).toEqual([
      ['1 day', 'Sat 10 Oct'],
      ['3 days', 'Mon 12 Oct'],
      ['7 days', 'Default · Fri 16 Oct'],
      ['2 weeks', 'Fri 23 Oct'],
      ['1 month', 'Sun 8 Nov'],
    ])
    expect(opts[2].value).toBe(keepUntil(now, 7))
  })

  it('labels the main button', () => {
    expect(keepButtonLabel(7)).toBe('Keep 7 days')
    expect(keepButtonLabel(14)).toBe('Keep 2 weeks')
  })
})

describe('custom keep', () => {
  it('accepts a number of days', () => {
    expect(parseCustomKeep(' 10 ', now)).toEqual({ until: keepUntil(now, 10) })
  })

  it('accepts a future date as local midnight', () => {
    expect(parseCustomKeep('2026-10-20', now)).toEqual({ until: new Date(2026, 9, 20).getTime() })
  })

  it('rejects bad entries', () => {
    for (const v of ['', '0', '400', 'soon', '2026-10-09', '2026-02-30', '2028-01-01']) {
      expect(parseCustomKeep(v, now)).toHaveProperty('error')
    }
  })
})
