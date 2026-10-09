import { describe, expect, it } from 'vitest'
import { DAY, HOUR, MINUTE } from '@/shared/time'
import { createdLabel, editedLabel, wordCount } from '@/lib/editor/meta'

const now = new Date(2026, 9, 9, 15, 0).getTime()

describe('editedLabel', () => {
  it('reads relative to now', () => {
    expect(editedLabel(now - 10_000, now)).toBe('Edited just now')
    expect(editedLabel(now + 5_000, now)).toBe('Edited just now')
    expect(editedLabel(now - 5 * MINUTE, now)).toBe('Edited 5m ago')
    expect(editedLabel(now - 3 * HOUR, now)).toBe('Edited 3h ago')
    expect(editedLabel(now - DAY, now)).toBe('Edited yesterday')
    expect(editedLabel(now - 4 * DAY, now)).toBe('Edited 4 days ago')
  })
})

describe('createdLabel', () => {
  it('counts calendar days', () => {
    expect(createdLabel(now - HOUR, now)).toBe('Created today')
    expect(createdLabel(now - DAY, now)).toBe('Created yesterday')
    expect(createdLabel(now - 12 * DAY, now)).toBe('Created 12 days ago')
  })
})

describe('wordCount', () => {
  it('ignores Markdown markers', () => {
    expect(wordCount('# Travel The Unknown\n\n- [ ] book flights\n1. one thing\n> quoted text\n\n---')).toBe(9)
    expect(wordCount('')).toBe(0)
  })
})
