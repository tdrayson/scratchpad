import { describe, expect, it } from 'vitest'
import { dayCount, noteMeta, relativeDays, shortDate, upperFirst } from '@/lib/review/format'
import { DAY } from '@/shared/time'

const now = new Date(2026, 9, 9, 15, 0).getTime()

describe('review format', () => {
  it('pluralises days', () => {
    expect(dayCount(1)).toBe('1 day')
    expect(dayCount(30)).toBe('30 days')
  })

  it('describes calendar days ago', () => {
    expect(relativeDays(now - 1000, now)).toBe('today')
    expect(relativeDays(now - DAY, now)).toBe('yesterday')
    expect(relativeDays(now - 16 * DAY, now)).toBe('16 days ago')
    expect(upperFirst(relativeDays(now - 9 * DAY, now))).toBe('9 days ago')
    expect(upperFirst('today')).toBe('Today')
  })

  it('formats dates as weekday day month', () => {
    expect(shortDate(new Date(2026, 9, 10).getTime(), 'en-GB')).toBe('Sat 10 Oct')
    expect(shortDate(new Date(2026, 10, 8).getTime(), 'en-US')).toBe('Sun 8 Nov')
  })

  it('builds the card meta line', () => {
    const note = { createdAt: now - 16 * DAY, updatedAt: now - 9 * DAY, words: 86 }
    expect(noteMeta(note, now)).toBe('Created 16 days ago · Last edited 9 days ago · 86 words')
    expect(noteMeta({ ...note, words: 1 }, now)).toMatch(/1 word$/)
  })
})
