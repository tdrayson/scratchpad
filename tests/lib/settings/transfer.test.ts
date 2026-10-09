import { describe, expect, it } from 'vitest'
import { exportMessage, importMessage } from '@/lib/settings/transfer'

describe('exportMessage', () => {
  it('names the zip, not the whole path', () => {
    expect(exportMessage(1, '/Users/t/Desktop/Scratchpad Export 2026-10-09.zip')).toBe(
      'Exported 1 note to Scratchpad Export 2026-10-09.zip',
    )
  })
})

describe('importMessage', () => {
  it('reports imports, archived notes and duplicates', () => {
    expect(importMessage({ imported: 12, archived: 3, skipped: 2 })).toBe(
      'Imported 12 notes, 3 into the archive. Skipped 2 duplicates.',
    )
    expect(importMessage({ imported: 1, archived: 0, skipped: 0 })).toBe('Imported 1 note.')
  })

  it('says when there was nothing to do', () => {
    expect(importMessage({ imported: 0, archived: 0, skipped: 4 })).toBe('Nothing new to import. Skipped 4 duplicates.')
    expect(importMessage({ imported: 0, archived: 0, skipped: 0 })).toBe('No Markdown files found.')
  })
})
