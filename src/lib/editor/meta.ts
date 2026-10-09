import { daysBetween, HOUR, MINUTE } from '@/shared/time'

/**
 * Toolbar label for when a note was last edited.
 * @param at - Last edit in epoch ms.
 * @param now - Current time in epoch ms.
 * @return E.g. "Edited just now", "Edited 5m ago", "Edited yesterday".
 */
export function editedLabel(at: number, now: number): string {
  const ago = Math.max(0, now - at)
  if (ago < MINUTE) return 'Edited just now'
  if (ago < HOUR) return `Edited ${Math.floor(ago / MINUTE)}m ago`
  const days = daysBetween(at, now)
  if (days === 0) return `Edited ${Math.floor(ago / HOUR)}h ago`
  return days === 1 ? 'Edited yesterday' : `Edited ${days} days ago`
}

/**
 * Status bar label for when a note was created.
 * @param at - Creation time in epoch ms.
 * @param now - Current time in epoch ms.
 * @return "Created today", "Created yesterday" or "Created N days ago".
 */
export function createdLabel(at: number, now: number): string {
  const days = Math.max(0, daysBetween(at, now))
  if (days === 0) return 'Created today'
  return days === 1 ? 'Created yesterday' : `Created ${days} days ago`
}

/**
 * Counts words in Markdown, ignoring block markers like `#`, `-`, `1.` and `[ ]`.
 * @param markdown - The note as Markdown.
 * @return Number of words.
 */
export function wordCount(markdown: string): number {
  const text = markdown.replace(/^\s*(?:#{1,6}|>|[-*+]|\d+\.)(?=\s)/gm, '').replace(/\[[ xX]\]/g, '')
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}
