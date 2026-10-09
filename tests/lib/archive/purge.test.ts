import { describe, expect, it } from 'vitest'
import { purgeFraction, purgeLabel, purgeSoon, stepIndex } from '@/lib/archive/purge'

describe('archive countdown', () => {
  it('labels days left', () => {
    expect(purgeLabel(0)).toBe('Today')
    expect(purgeLabel(1)).toBe('1 day')
    expect(purgeLabel(21)).toBe('21 days')
  })

  it('fills the bar by time remaining', () => {
    expect(purgeFraction(21, 30)).toBeCloseTo(0.7)
    expect(purgeFraction(40, 30)).toBe(1)
    expect(purgeFraction(5, 0)).toBe(0)
  })

  it('warns at three days or fewer', () => {
    expect(purgeSoon(4)).toBe(false)
    expect(purgeSoon(3)).toBe(true)
  })

  it('steps through rows within bounds', () => {
    expect(stepIndex(-1, 1, 3)).toBe(0)
    expect(stepIndex(-1, -1, 3)).toBe(2)
    expect(stepIndex(2, 1, 3)).toBe(2)
    expect(stepIndex(0, -1, 3)).toBe(0)
    expect(stepIndex(0, 1, 0)).toBe(-1)
  })
})
