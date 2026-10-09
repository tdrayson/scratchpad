import { ageLabel, daysUntilPurge } from '@/shared/lifecycle'
import { SHORTCUTS } from '@/shared/shortcuts'
import type { NoteSummary, SearchHit } from '@/shared/types'

/** A run of snippet text; `match` marks a search hit. */
export interface SnippetPart {
  text: string
  match: boolean
}

/** An action listed in the palette: a registry shortcut, or the palette-only "New note “…”". */
export interface PaletteAction {
  id: string
  label: string
}

export type PaletteItem =
  | { kind: 'note'; key: string; note: NoteSummary; snippet: SnippetPart[]; meta: string }
  | { kind: 'archived'; key: string; note: NoteSummary; snippet: SnippetPart[]; meta: string }
  | { kind: 'action'; key: string; action: PaletteAction; text?: string }

export interface PaletteSection {
  id: 'notes' | 'recent' | 'archive' | 'actions'
  label: string
  trailing?: string
  items: PaletteItem[]
}

export const NEW_NOTE_WITH_TEXT = 'newNoteWithText'

/** The combo that creates a note from the query; local to the palette, so not in the registry. */
export const NEW_NOTE_COMBO = 'cmd+enter'

const RECENT_LIMIT = 8

const HIDDEN = ['quickCapture', 'search']

const LABELS: Record<string, string> = { review: 'Start review', archive: 'Open archive' }

/** Every registry shortcut the palette can run, with palette wording. */
export const PALETTE_ACTIONS: PaletteAction[] = SHORTCUTS.filter((s) => !HIDDEN.includes(s.id)).map((s) => ({
  id: s.id,
  label: LABELS[s.id] ?? s.label,
}))

/**
 * Splits a backend snippet into plain and matched runs.
 * @param snippet - Text with matches wrapped in \u0001 … \u0002 markers.
 * @return Non-empty runs in order.
 */
export function parseSnippet(snippet: string): SnippetPart[] {
  const parts: SnippetPart[] = []
  for (const [i, chunk] of snippet.split(/[\u0001\u0002]/).entries()) {
    if (chunk) parts.push({ text: chunk, match: i % 2 === 1 })
  }
  return parts
}

/**
 * How well a label matches a lowercase query.
 * @param label - Action label.
 * @param q - Lowercased, trimmed query.
 * @return 3 for a label prefix, 2 for a word prefix, 1 for a substring, 0 for no match.
 */
function score(label: string, q: string): number {
  const l = label.toLowerCase()
  if (l.startsWith(q)) return 3
  if (l.split(/\s+/).some((w) => w.startsWith(q))) return 2
  return l.includes(q) ? 1 : 0
}

/**
 * Actions matching a query, best first: label prefix, then word prefix, then substring.
 * @param query - What the user typed.
 * @param actions - Candidate actions.
 * @return Matching actions; all of them for an empty query.
 */
export function filterActions(query: string, actions: PaletteAction[] = PALETTE_ACTIONS): PaletteAction[] {
  const q = query.trim().toLowerCase()
  if (!q) return actions
  return actions
    .map((a) => ({ a, s: score(a.label, q) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a)
}

/**
 * Groups search results, recent notes and actions into the palette's sections.
 * @param input - query: the trimmed-or-not query · hits: search results · recent: active notes for an empty query · now: epoch ms · archiveDays: archive retention.
 * @return Non-empty sections in display order.
 */
export function buildSections(input: {
  query: string
  hits: SearchHit[]
  recent: NoteSummary[]
  now: number
  archiveDays: number
}): PaletteSection[] {
  const { query, hits, recent, now, archiveDays } = input
  const q = query.trim()
  const sections: PaletteSection[] = []

  if (!q) {
    const items: PaletteItem[] = [...recent]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, RECENT_LIMIT)
      .map((note) => ({ kind: 'note', key: `n:${note.id}`, note, snippet: [{ text: note.preview, match: false }], meta: ageLabel(note.updatedAt, now) }))
    if (items.length) sections.push({ id: 'recent', label: 'Recent', items })
  } else {
    const active = hits.filter((h) => h.note.archivedAt === null)
    const archived = hits.filter((h) => h.note.archivedAt !== null)
    if (active.length) {
      sections.push({
        id: 'notes',
        label: 'Notes',
        trailing: `${active.length} ${active.length === 1 ? 'match' : 'matches'}`,
        items: active.map((h) => ({ kind: 'note', key: `n:${h.note.id}`, note: h.note, snippet: parseSnippet(h.snippet), meta: ageLabel(h.note.updatedAt, now) })),
      })
    }
    if (archived.length) {
      sections.push({
        id: 'archive',
        label: 'In archive',
        items: archived.map((h) => ({
          kind: 'archived',
          key: `a:${h.note.id}`,
          note: h.note,
          snippet: parseSnippet(h.snippet),
          meta: `Deletes in ${daysUntilPurge(h.note.archivedAt!, archiveDays, now)}d`,
        })),
      })
    }
  }

  const actions: PaletteItem[] = filterActions(q).map((action) => ({ kind: 'action', key: `x:${action.id}`, action }))
  if (q) actions.unshift({ kind: 'action', key: 'x:new', action: { id: NEW_NOTE_WITH_TEXT, label: `New note “${q}”` }, text: q })
  if (actions.length) sections.push({ id: 'actions', label: 'Actions', items: actions })
  return sections
}

/**
 * Builds a synthetic keydown for a combo, so the palette can trigger shortcuts other components own.
 * @param combo - The combo, e.g. 'cmd+shift+c'.
 * @return Event init with modifiers, key and code.
 */
export function eventInitFor(combo: string): KeyboardEventInit {
  const parts = combo.split('+')
  const key = parts[parts.length - 1]
  const codes: Record<string, string> = {
    space: 'Space', enter: 'Enter', backspace: 'Backspace', delete: 'Delete', escape: 'Escape', tab: 'Tab',
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft',
    ']': 'BracketRight', '\\': 'Backslash', '-': 'Minus', '=': 'Equal', '`': 'Backquote',
  }
  const code = /^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : /^f\d+$/.test(key) ? key.toUpperCase() : (codes[key] ?? key)
  return {
    key: key.length === 1 ? key : code,
    code,
    metaKey: parts.includes('cmd'),
    ctrlKey: parts.includes('ctrl'),
    altKey: parts.includes('alt'),
    shiftKey: parts.includes('shift'),
    bubbles: true,
    cancelable: true,
  }
}
