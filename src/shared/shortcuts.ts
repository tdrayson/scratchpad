/**
 * Combos are lowercase '+'-joined tokens: modifiers (cmd, ctrl, alt, shift) in that
 * order, then one key ('k', 'space', 'enter', 'backspace', 'up', ',' …).
 */
export type Combo = string

export type ShortcutGroup = 'anywhere' | 'notes' | 'navigation'

export interface ShortcutDef {
  id: string
  label: string
  group: ShortcutGroup
  default: Combo
}

export const SHORTCUTS: ShortcutDef[] = [
  { id: 'quickCapture', label: 'New note from anywhere', group: 'anywhere', default: 'alt+space' },
  { id: 'newNote', label: 'New note', group: 'notes', default: 'cmd+n' },
  { id: 'archiveNote', label: 'Archive note', group: 'notes', default: 'cmd+e' },
  { id: 'copyMarkdown', label: 'Copy note as Markdown', group: 'notes', default: 'cmd+shift+c' },
  { id: 'deleteNote', label: 'Delete permanently', group: 'notes', default: 'cmd+backspace' },
  { id: 'prevNote', label: 'Previous note', group: 'notes', default: 'alt+up' },
  { id: 'nextNote', label: 'Next note', group: 'notes', default: 'alt+down' },
  { id: 'search', label: 'Search', group: 'navigation', default: 'cmd+k' },
  { id: 'toggleSidebar', label: 'Show / hide sidebar', group: 'navigation', default: 'cmd+s' },
  { id: 'review', label: 'Review', group: 'navigation', default: 'cmd+shift+r' },
  { id: 'archive', label: 'Archive', group: 'navigation', default: 'cmd+shift+a' },
  { id: 'settings', label: 'Settings', group: 'navigation', default: 'cmd+,' },
]

export const RESERVED: Combo[] = ['cmd+q', 'cmd+c', 'cmd+v', 'cmd+x', 'cmd+a', 'cmd+z', 'cmd+shift+z', 'cmd+w', 'cmd+h']

const MODS = ['cmd', 'ctrl', 'alt', 'shift'] as const

const CODE_KEYS: Record<string, string> = {
  Space: 'space',
  Enter: 'enter',
  NumpadEnter: 'enter',
  Backspace: 'backspace',
  Delete: 'delete',
  Escape: 'escape',
  Tab: 'tab',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
}

const GLYPHS: Record<string, string> = {
  cmd: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '↵',
  backspace: '⌫',
  delete: '⌦',
  escape: 'esc',
  tab: '⇥',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: 'Space',
}

type KeyLike = Pick<KeyboardEvent, 'code' | 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>

/**
 * The key token for an event, read from the physical key so ⌥ and ⇧ don't change letters.
 * @param e - The keyboard event.
 * @return The key token, or null for a bare modifier.
 */
export function keyOf(e: Pick<KeyboardEvent, 'code' | 'key'>): string | null {
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase()
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5)
  if (/^F\d{1,2}$/.test(e.code)) return e.code.toLowerCase()
  if (CODE_KEYS[e.code]) return CODE_KEYS[e.code]
  if (['Meta', 'Control', 'Alt', 'Shift', 'CapsLock'].includes(e.key)) return null
  return e.key.length === 1 ? e.key.toLowerCase() : null
}

/**
 * Builds a combo from a keyboard event.
 * @param e - The keyboard event.
 * @return The combo, or null for a bare modifier press.
 */
export function comboFromEvent(e: KeyLike): Combo | null {
  const key = keyOf(e)
  if (!key) return null
  const mods = [e.metaKey && 'cmd', e.ctrlKey && 'ctrl', e.altKey && 'alt', e.shiftKey && 'shift'].filter(Boolean)
  return [...mods, key].join('+')
}

/**
 * Whether a keyboard event is the given combo.
 * @param e - The keyboard event.
 * @param combo - The combo to test against.
 * @return True on an exact match, modifiers included.
 */
export function matches(e: KeyLike, combo: Combo): boolean {
  return comboFromEvent(e) === combo
}

/**
 * Splits a combo into display glyphs, one per keycap.
 * @param combo - The combo, e.g. 'cmd+shift+c'.
 * @return Keycap labels, e.g. ['⌘', '⇧', 'C'].
 */
export function glyphs(combo: Combo): string[] {
  return combo.split('+').map((t) => GLYPHS[t] ?? t.toUpperCase())
}

/**
 * Compact single-string form of a combo, for tooltips and hints.
 * @param combo - The combo, e.g. 'cmd+shift+c'.
 * @return The glyphs joined, e.g. '⌘⇧C'.
 */
export function formatCombo(combo: Combo): string {
  return glyphs(combo).join('')
}

/**
 * Resolves every shortcut against the user's overrides.
 * @param overrides - Combos the user changed, keyed by shortcut id.
 * @return The effective combo for every shortcut id.
 */
export function resolveShortcuts(overrides: Record<string, string>): Record<string, Combo> {
  return Object.fromEntries(SHORTCUTS.map((s) => [s.id, overrides[s.id] ?? s.default]))
}

export type ComboProblem = { kind: 'reserved' } | { kind: 'conflict'; with: string } | { kind: 'noModifier' }

/**
 * Checks whether a combo can be assigned to a shortcut. An empty combo clears it and is always valid.
 * @param id - The shortcut being changed.
 * @param combo - The proposed combo.
 * @param current - Effective combos for every shortcut.
 * @return The problem, or null if the combo is free.
 */
export function validateCombo(id: string, combo: Combo, current: Record<string, Combo>): ComboProblem | null {
  if (!combo) return null
  if (RESERVED.includes(combo)) return { kind: 'reserved' }
  const parts = combo.split('+')
  if (!parts.some((p) => (MODS as readonly string[]).includes(p))) return { kind: 'noModifier' }
  const clash = Object.entries(current).find(([other, c]) => other !== id && c === combo)
  return clash ? { kind: 'conflict', with: clash[0] } : null
}

