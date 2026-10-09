import { describe, expect, it } from 'vitest'
import {
  CUSTOM_OFFSETS,
  PRESET_OFFSETS,
  edgeDescription,
  offsetLabel,
  offsetOptions,
  offsetShort,
  scheduleCaption,
  segments,
  stateLabel,
  timeOptions,
  withAnchor,
} from '@/lib/settings/schedule'

describe('offset options', () => {
  it('labels presets as the design does', () => {
    expect(PRESET_OFFSETS.map(offsetLabel)).toEqual([
      '3 h before',
      '2 h before',
      '1 h before',
      '30 min before',
      'On time',
      '30 min after',
      '1 h after',
      '2 h after',
    ])
  })

  it('shortens offsets for the trigger', () => {
    expect([0, 60, -120, 30, -75].map(offsetShort)).toEqual(['On time', '+1 h', '−2 h', '+30 min', '−1 h 15 min'])
  })

  it('resolves each option to a time, wrapping midnight', () => {
    const opts = offsetOptions(18 * 60 + 41, [-120, 0, 120])
    expect(opts.map((o) => o.detail)).toEqual(['16:41', '18:41', '20:41'])
    expect(offsetOptions(23 * 60, [120])[0].detail).toBe('01:00')
    expect(offsetOptions(30, [-60])[0].detail).toBe('23:30')
  })

  it('offers ±3 h in 15-minute steps', () => {
    expect(CUSTOM_OFFSETS).toHaveLength(25)
    expect(CUSTOM_OFFSETS[0]).toBe(-180)
    expect(CUSTOM_OFFSETS.at(-1)).toBe(180)
    expect(CUSTOM_OFFSETS).toContain(0)
  })
})

describe('fixed times', () => {
  it('lists every 30 minutes and keeps an off-grid current time', () => {
    expect(timeOptions(420)).toHaveLength(48)
    const opts = timeOptions(7 * 60 + 15)
    expect(opts).toHaveLength(49)
    expect(opts.map((o) => o.label).slice(14, 17)).toEqual(['07:00', '07:15', '07:30'])
  })

  it('starts a switch to Fixed time from the resolved time, rounded', () => {
    const edge = { anchor: 'sunrise' as const, time: 0, offset: 60 }
    expect(withAnchor(edge, 'fixed', 8 * 60 + 12)).toEqual({ anchor: 'fixed', time: 8 * 60, offset: 60 })
    expect(withAnchor(edge, 'sunset', 0)).toEqual({ ...edge, anchor: 'sunset' })
  })
})

describe('descriptions', () => {
  it('describes each kind of edge', () => {
    expect(edgeDescription({ anchor: 'sunrise', time: 0, offset: 0 }, 432)).toBe('07:12 today, at sunrise.')
    expect(edgeDescription({ anchor: 'sunrise', time: 0, offset: 60 }, 492)).toBe('08:12 today — an hour after sunrise.')
    expect(edgeDescription({ anchor: 'sunset', time: 0, offset: -120 }, 1001)).toBe(
      '16:41 today — two hours before sunset.',
    )
    expect(edgeDescription({ anchor: 'sunset', time: 0, offset: 75 }, 1196)).toBe(
      '19:56 today — an hour and 15 minutes after sunset.',
    )
    expect(edgeDescription({ anchor: 'fixed', time: 420, offset: 0 }, 420)).toBe('Every day. Ignores location.')
  })

  it('captions the timeline for each variant', () => {
    const sun = { light: 432, dark: 1121 }
    const rise = { anchor: 'sunrise' as const, time: 0, offset: 0 }
    const set = { anchor: 'sunset' as const, time: 0, offset: 0 }
    const fixed = { anchor: 'fixed' as const, time: 0, offset: 0 }
    expect(scheduleCaption(rise, set, sun, sun)).toEqual({ text: 'Light 07:12 – 18:41 today', usesLocation: true })
    expect(scheduleCaption(rise, set, { light: 492, dark: 1001 }, sun).text).toBe(
      'Light 08:12 – 16:41 · sun 07:12 – 18:41',
    )
    expect(scheduleCaption(fixed, fixed, { light: 420, dark: 1140 }, sun)).toEqual({
      text: 'Light 07:00 – 19:00 every day',
      usesLocation: false,
    })
  })

  it('states the countdown', () => {
    expect(stateLabel(true, 266)).toBe('Light now · dark in 4h 26m')
    expect(stateLabel(false, 45)).toBe('Dark now · light in 45m')
  })
})

describe('timeline segments', () => {
  it('maps a daytime window to one segment', () => {
    expect(segments({ light: 360, dark: 1080 })).toEqual([{ from: 0.25, width: 0.5 }])
  })

  it('splits a window that wraps past midnight', () => {
    expect(segments({ light: 1080, dark: 360 })).toEqual([
      { from: 0.75, width: 0.25 },
      { from: 0, width: 0.25 },
    ])
  })

  it('drops an empty tail when the window ends at midnight', () => {
    expect(segments({ light: 1080, dark: 0 })).toEqual([{ from: 0.75, width: 0.25 }])
  })

  it('treats equal edges as light all day', () => {
    expect(segments({ light: 600, dark: 600 })).toEqual([{ from: 0, width: 1 }])
  })
})
