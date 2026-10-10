import { describe, expect, it } from 'vitest'
import { exportName, fileName, isArchivedPath, isNoteFile, planImport, titled } from '@/shared/transfer'

describe('fileName', () => {
  it('makes titles safe and unique per folder', () => {
    const used = new Set<string>()
    expect(fileName('a/b: c?', used)).toBe('a-b- c-.md')
    expect(fileName('', used)).toBe('Untitled.md')
    expect(fileName('untitled', used)).toBe('untitled 2.md')
  })
})

describe('exportName', () => {
  it('dates the export', () => {
    expect(exportName(new Date(2026, 9, 9, 15).getTime())).toBe('Scratchpad Export 2026-10-09')
  })
})

describe('isNoteFile', () => {
  it('accepts visible Markdown and text files only', () => {
    expect(isNoteFile('Export/Note.md')).toBe(true)
    expect(isNoteFile('Note.MARKDOWN')).toBe(true)
    expect(isNoteFile('notes.txt')).toBe(true)
    expect(isNoteFile('photo.png')).toBe(false)
    expect(isNoteFile('.hidden.md')).toBe(false)
    expect(isNoteFile('__MACOSX/Export/._Note.md')).toBe(false)
  })
})

describe('isArchivedPath', () => {
  it('spots an Archive folder at any depth', () => {
    expect(isArchivedPath('Export/Archive/Old.md')).toBe(true)
    expect(isArchivedPath('archive/Old.md')).toBe(true)
    expect(isArchivedPath('Export/Archive.md')).toBe(false)
    expect(isArchivedPath('Export/Old.md')).toBe(false)
  })
})

describe('titled', () => {
  it('keeps an existing title', () => {
    expect(titled('# Plans\n\nBody\n', 'x.md')).toBe('# Plans\n\nBody')
  })

  it('adds the file name as the title otherwise', () => {
    expect(titled('Body', 'Folder/Shopping list.md')).toBe('# Shopping list\n\nBody')
    expect(titled('## Sub\ntext', 'a.txt')).toBe('# a\n\n## Sub\ntext')
    expect(titled('  ', 'Empty.md')).toBe('# Empty')
  })

  it('normalises line endings and a byte-order mark', () => {
    expect(titled('﻿# T\r\nline', 'x.md')).toBe('# T\nline')
  })
})

describe('planImport', () => {
  const file = (path: string, text: string) => ({ path, text, modifiedAt: 1000 })

  it('skips notes already stored and repeats within the import', () => {
    const plan = planImport(
      [file('E/A.md', '# A\n\none'), file('E/B.md', '# B'), file('E/Archive/B.md', '# B')],
      ['# A\n\none\n'],
    )
    expect(plan.notes.map((n) => n.markdown)).toEqual(['# B'])
    expect(plan.skipped).toBe(2)
  })

  it('marks files from an Archive folder as archived and keeps their dates', () => {
    const plan = planImport([file('E/Archive/Old.md', '# Old')], [])
    expect(plan.notes).toEqual([{ markdown: '# Old', modifiedAt: 1000, archived: true, images: {} }])
  })
})
