import { describe, expect, it } from 'vitest'
import { edgeMinutes, inLight, isLightAt, sunTimes } from '../sun'
import type { SunEdge } from '../types'

const london = { lat: 51.5074, lng: -0.1278 }
const fixed = (h: number): SunEdge => ({ anchor: 'fixed', time: h * 60, offset: 0 })
const at = (h: number, mi = 0) => new Date(2026, 9, 9, h, mi).getTime()

describe('sun', () => {
  it('computes London sunrise and sunset in October', () => {
    const { sunrise, sunset } = sunTimes(at(12), london)
    expect(Math.abs(sunrise - (7 * 60 + 12))).toBeLessThan(90)
    expect(Math.abs(sunset - (18 * 60 + 25))).toBeLessThan(90)
  })

  it('applies offsets', () => {
    const base = edgeMinutes({ anchor: 'sunset', time: 0, offset: 0 }, at(12), london)
    expect(edgeMinutes({ anchor: 'sunset', time: 0, offset: -120 }, at(12), london)).toBe(base - 120)
  })

  it('handles fixed hours', () => {
    expect(isLightAt(at(8), fixed(7), fixed(19), null)).toBe(true)
    expect(isLightAt(at(20), fixed(7), fixed(19), null)).toBe(false)
  })

  it('handles windows that wrap midnight', () => {
    expect(inLight(23 * 60, { light: 22 * 60, dark: 2 * 60 })).toBe(true)
    expect(inLight(12 * 60, { light: 22 * 60, dark: 2 * 60 })).toBe(false)
  })

  it('falls back without a location', () => {
    expect(sunTimes(at(12), null)).toEqual({ sunrise: 420, sunset: 1140 })
  })
})
