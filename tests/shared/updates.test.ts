import { describe, expect, it } from 'vitest'
import { isNewer, updateMessage } from '@/shared/updates'

describe('isNewer', () => {
  it.each([
    ['v0.4.0', '0.3.0', true],
    ['0.3.1', '0.3.0', true],
    ['v1.0.0', '0.9.9', true],
    ['0.10.0', '0.9.0', true],
    ['v0.3.0', '0.3.0', false],
    ['0.2.9', '0.3.0', false],
    ['v0.3', '0.3.0', false],
  ])('%s over %s is %s', (latest, current, expected) => {
    expect(isNewer(latest, current)).toBe(expected)
  })
})

describe('updateMessage', () => {
  it('names the new version or confirms the current one', () => {
    expect(updateMessage({ current: '0.3.0', latest: '0.4.0', available: true })).toBe('Scratchpad 0.4.0 is available.')
    expect(updateMessage({ current: '0.3.0', latest: '0.3.0', available: false })).toBe(
      "You're on the latest version (0.3.0).",
    )
  })
})
