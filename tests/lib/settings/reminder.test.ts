import { describe, expect, it } from 'vitest'
import { applyChoice, clockLabel, reminderChoice, reminderLabel, reminderOptions } from '@/lib/settings/reminder'

const monday = { enabled: true, day: 1, time: 540 }

describe('reminder labels', () => {
  it('formats times without a leading zero', () => {
    expect(clockLabel(540)).toBe('9:00')
    expect(clockLabel(17 * 60 + 30)).toBe('17:30')
  })

  it('labels each schedule', () => {
    expect(reminderLabel(monday)).toBe('Mondays, 9:00')
    expect(reminderLabel({ ...monday, day: null })).toBe('Every day, 9:00')
    expect(reminderLabel({ ...monday, day: 0 })).toBe('Sundays, 9:00')
    expect(reminderLabel({ ...monday, enabled: false })).toBe('Off')
  })

  it('lists Off, Every day, then Monday to Sunday', () => {
    const labels = reminderOptions(600).map((o) => o.label)
    expect(labels[0]).toBe('Off')
    expect(labels[1]).toBe('Every day, 10:00')
    expect(labels[2]).toBe('Mondays, 10:00')
    expect(labels.at(-1)).toBe('Sundays, 10:00')
    expect(labels).toHaveLength(9)
  })
})

describe('reminder choices', () => {
  it('round-trips through the menu value', () => {
    expect(reminderChoice(monday)).toBe('1')
    expect(applyChoice(monday, 'daily')).toEqual({ enabled: true, day: null, time: 540 })
    expect(applyChoice(monday, 'off')).toEqual({ ...monday, enabled: false })
    expect(applyChoice({ ...monday, enabled: false }, '5')).toEqual({ enabled: true, day: 5, time: 540 })
  })
})
