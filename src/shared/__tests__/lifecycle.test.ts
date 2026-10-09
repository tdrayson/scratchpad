import { describe, expect, it } from 'vitest'
import {
  ageLabel,
  daysUntilPurge,
  groupOf,
  isPurgeable,
  isStale,
  keepOptions,
  reviewQueue,
  staleAt,
} from '../lifecycle'
import { DAY, HOUR } from '../time'

const now = new Date(2026, 9, 9, 15, 0).getTime()
const note = (ageDays: number, extra: Partial<{ keptUntil: number; archivedAt: number }> = {}) => ({
  updatedAt: now - ageDays * DAY,
  keptUntil: extra.keptUntil ?? null,
  archivedAt: extra.archivedAt ?? null,
})

describe('staleness', () => {
  it('goes stale after the configured days', () => {
    expect(isStale(note(6), 7, now)).toBe(false)
    expect(isStale(note(7), 7, now)).toBe(true)
  })

  it('respects a later keep date', () => {
    const kept = note(20, { keptUntil: now + DAY })
    expect(isStale(kept, 7, now)).toBe(false)
    expect(staleAt(kept, 7)).toBe(now + DAY)
  })

  it('never treats archived notes as stale', () => {
    expect(isStale(note(30, { archivedAt: now }), 7, now)).toBe(false)
  })
})

describe('groupOf', () => {
  it('buckets by age', () => {
    expect(groupOf(note(0), 7, now)).toBe('today')
    expect(groupOf(note(3), 7, now)).toBe('week')
    expect(groupOf(note(9), 14, now)).toBe('earlier')
    expect(groupOf(note(12), 7, now)).toBe('stale')
    expect(groupOf(note(1, { archivedAt: now }), 7, now)).toBe('archived')
  })
})

describe('ageLabel', () => {
  it('compacts durations', () => {
    expect(ageLabel(now - 10_000, now)).toBe('Now')
    expect(ageLabel(now - 3 * HOUR, now)).toBe('3h')
    expect(ageLabel(now - 12 * DAY, now)).toBe('12d')
  })
})

describe('review queue', () => {
  it('lists stale notes oldest first', () => {
    const q = reviewQueue([note(12), note(2), note(16)], 7, now)
    expect(q.map((n) => Math.round((now - n.updatedAt) / DAY))).toEqual([16, 12])
  })
})

describe('keep', () => {
  it('offers presets with return dates', () => {
    const opts = keepOptions(now)
    expect(opts.map((o) => o.label)).toEqual(['1 day', '3 days', '7 days', '2 weeks', '1 month'])
    expect(new Date(opts[0].until).getDate()).toBe(10)
  })
})

describe('purge', () => {
  it('deletes after the archive window', () => {
    expect(isPurgeable(note(0, { archivedAt: now - 29 * DAY }), 30, now)).toBe(false)
    expect(isPurgeable(note(0, { archivedAt: now - 30 * DAY }), 30, now)).toBe(true)
    expect(daysUntilPurge(now - 10 * DAY, 30, now)).toBe(20)
  })
})
