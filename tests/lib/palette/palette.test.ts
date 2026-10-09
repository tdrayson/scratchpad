import { describe, expect, it } from 'vitest'
import { buildSections, eventInitFor, filterActions, NEW_NOTE_WITH_TEXT, parseSnippet, PALETTE_ACTIONS } from '@/lib/palette/palette'
import { comboFromEvent } from '@/shared/shortcuts'
import { DAY } from '@/shared/time'
import type { NoteSummary, SearchHit } from '@/shared/types'

const now = new Date(2026, 9, 9, 15, 0).getTime()

const summary = (id: string, extra: Partial<NoteSummary> = {}): NoteSummary => ({
  id,
  title: id,
  markdown: '',
  preview: `${id} preview`,
  words: 1,
  createdAt: now,
  updatedAt: now,
  keptUntil: null,
  archivedAt: null,
  ...extra,
})

const hit = (note: NoteSummary, snippet = 'a \u0001b\u0002 c'): SearchHit => ({ note, snippet })

describe('parseSnippet', () => {
  it('splits marked matches into runs', () => {
    expect(parseSnippet('…html the \u0001currency\u0002 position')).toEqual([
      { text: '…html the ', match: false },
      { text: 'currency', match: true },
      { text: ' position', match: false },
    ])
  })

  it('handles leading matches, several matches and no markers', () => {
    expect(parseSnippet('\u0001a\u0002 b \u0001c\u0002')).toEqual([
      { text: 'a', match: true },
      { text: ' b ', match: false },
      { text: 'c', match: true },
    ])
    expect(parseSnippet('plain')).toEqual([{ text: 'plain', match: false }])
  })
})

describe('filterActions', () => {
  it('returns every action for an empty query', () => {
    expect(filterActions('  ')).toEqual(PALETTE_ACTIONS)
  })

  it('ranks label prefix over word prefix over substring', () => {
    const actions = [
      { id: 'a', label: 'Unarchive' },
      { id: 'b', label: 'Open archive' },
      { id: 'c', label: 'Archive note' },
      { id: 'd', label: 'Settings' },
    ]
    expect(filterActions('arch', actions).map((a) => a.id)).toEqual(['c', 'b', 'a'])
  })

  it('leaves out the palette itself and the global quick capture', () => {
    const ids = PALETTE_ACTIONS.map((a) => a.id)
    expect(ids).not.toContain('search')
    expect(ids).not.toContain('quickCapture')
    expect(PALETTE_ACTIONS.find((a) => a.id === 'review')?.label).toBe('Start review')
  })
})

describe('buildSections', () => {
  const base = { hits: [], recent: [], now, archiveDays: 30 }

  it('groups hits into notes and archive, then actions led by New note', () => {
    const archived = summary('fx', { archivedAt: now - 9 * DAY })
    const sections = buildSections({
      ...base,
      query: 'currency',
      hits: [hit(summary('ttu')), hit(summary('da', { updatedAt: now - 2 * DAY })), hit(archived)],
    })
    expect(sections.map((s) => s.id)).toEqual(['notes', 'archive', 'actions'])
    expect(sections[0].trailing).toBe('2 matches')
    expect(sections[0].items.map((i) => i.kind === 'note' && i.meta)).toEqual(['Now', '2d'])
    expect(sections[1].items[0]).toMatchObject({ kind: 'archived', meta: 'Deletes in 21d' })
    expect(sections[2].items[0]).toMatchObject({ kind: 'action', action: { id: NEW_NOTE_WITH_TEXT, label: 'New note “currency”' }, text: 'currency' })
  })

  it('says "1 match" and drops empty sections', () => {
    const sections = buildSections({ ...base, query: 'zzzz', hits: [hit(summary('one'))] })
    expect(sections.map((s) => s.id)).toEqual(['notes', 'actions'])
    expect(sections[0].trailing).toBe('1 match')
    expect(sections[1].items).toHaveLength(1)
  })

  it('shows recent notes, newest first, and every action for an empty query', () => {
    const recent = [summary('old', { updatedAt: now - 3 * DAY }), summary('new')]
    const sections = buildSections({ ...base, query: '', recent })
    expect(sections.map((s) => s.id)).toEqual(['recent', 'actions'])
    expect(sections[0].items.map((i) => i.kind !== 'action' && i.note.id)).toEqual(['new', 'old'])
    expect(sections[1].items).toHaveLength(PALETTE_ACTIONS.length)
  })
})

describe('eventInitFor', () => {
  it.each(['cmd+shift+c', 'cmd+,', 'alt+up', 'cmd+backspace', 'cmd+1'])('round-trips %s', (combo) => {
    expect(comboFromEvent(new KeyboardEvent('keydown', eventInitFor(combo)))).toBe(combo)
  })
})
