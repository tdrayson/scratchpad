import { describe, expect, it } from 'vitest'
import { BLOCKS, filterBlocks } from '@/lib/editor/blocks'

/**
 * Ids of the blocks a query matches.
 * @param q - The query.
 * @return Block ids, best first.
 */
const ids = (q: string) => filterBlocks(BLOCKS, q).map((b) => b.id)

describe('filterBlocks', () => {
  it('lists every block in menu order for an empty query', () => {
    expect(ids('')).toEqual(['text', 'h2', 'h3', 'bullet', 'numbered', 'checklist', 'quote', 'code', 'image', 'divider'])
  })

  it('matches title prefixes first, case-insensitively', () => {
    expect(ids('HEAD')).toEqual(['h2', 'h3'])
    expect(ids('heading 2')).toEqual(['h2'])
    expect(ids('c')).toEqual(['checklist', 'code', 'quote'])
  })

  it('matches later words in the title', () => {
    expect(ids('list')).toEqual(['bullet', 'numbered', 'checklist'])
  })

  it('matches keywords and Markdown hints', () => {
    expect(ids('todo')).toEqual(['checklist'])
    expect(ids('hr')).toEqual(['divider'])
    expect(ids('##')).toEqual(['h2'])
  })

  it('returns nothing when nothing matches', () => {
    expect(ids('zzz')).toEqual([])
  })
})
