import { describe, expect, it } from 'vitest'
import { isBlank } from '@/lib/notes/blank'

describe('isBlank', () => {
  it('treats empty and title-marker-only notes as blank', () => {
    expect(isBlank('')).toBe(true)
    expect(isBlank('  \n')).toBe(true)
    expect(isBlank('#')).toBe(true)
    expect(isBlank('# ')).toBe(true)
  })

  it('treats anything typed as content', () => {
    expect(isBlank('# Groceries')).toBe(false)
    expect(isBlank('#\n\nbody')).toBe(false)
  })
})
