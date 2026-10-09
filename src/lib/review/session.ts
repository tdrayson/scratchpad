import { comboFromEvent } from '@/shared/shortcuts'

export interface ReviewState<T> {
  /** The note on screen, or null when nothing is left. */
  current: T | null
  /** Notes after the current one, in order. */
  upNext: T[]
  /** 1-based position of the current note in this session. */
  position: number
  /** Notes handled so far plus those still to come. */
  total: number
  /** Notes skipped this session that are still stale. */
  skipped: number
}

export type ReviewAction = 'archive' | 'keep' | 'open' | 'skip'

export type ProgressDisplay = { kind: 'segments'; done: boolean[] } | { kind: 'bar'; fraction: number }

/** Beyond this many notes, segments get too small and a single bar is shown. */
export const MAX_SEGMENTS = 12

const KEYS: Record<string, ReviewAction> = { e: 'archive', k: 'keep', enter: 'open', right: 'skip', s: 'skip' }

/**
 * Where a Review session stands, given the live queue and the notes already dealt with.
 * @param queue - Stale notes, oldest first.
 * @param seen - Ids archived, kept or skipped this session, in order.
 * @return The current note, what follows, and progress.
 */
export function reviewState<T extends { id: string }>(queue: T[], seen: string[]): ReviewState<T> {
  const done = new Set(seen)
  const remaining = queue.filter((n) => !done.has(n.id))
  const total = seen.length + remaining.length
  return {
    current: remaining[0] ?? null,
    upNext: remaining.slice(1),
    position: Math.min(seen.length + 1, total),
    total,
    skipped: queue.length - remaining.length,
  }
}

/**
 * How the toolbar shows progress: one segment per note, or a bar for long sessions.
 * @param total - Notes in the session.
 * @param done - Notes dealt with.
 * @return Segments (true = done) or a filled fraction.
 */
export function progressDisplay(total: number, done: number): ProgressDisplay {
  if (total > MAX_SEGMENTS) return { kind: 'bar', fraction: total ? Math.min(1, done / total) : 0 }
  return { kind: 'segments', done: Array.from({ length: total }, (_, i) => i < done) }
}

/**
 * Whether a key press belongs to something else: a field, a menu or a dialog.
 * @param target - The event target.
 * @return True when Review keys should stay out of the way.
 */
export function isOwnedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  return !!target.closest('[role="menu"],[role="dialog"],[contenteditable="true"]')
}

/**
 * The Review action a key press asks for.
 * @param e - The keyboard event.
 * @return The action, or null if the key isn't a Review key.
 */
export function reviewAction(e: KeyboardEvent): ReviewAction | null {
  if (e.defaultPrevented || e.isComposing || isOwnedTarget(e.target)) return null
  const combo = comboFromEvent(e)
  const action = combo ? KEYS[combo] : undefined
  if (!action) return null
  // Enter on a focused button should press that button, not open the note.
  if (action === 'open' && e.target instanceof HTMLElement && e.target.closest('button')) return null
  return action
}
