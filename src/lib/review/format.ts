import { daysBetween } from '@/shared/time'

/**
 * A count of days with the right plural.
 * @param n - Number of days.
 * @return '1 day' or 'n days'.
 */
export function dayCount(n: number): string {
  return n === 1 ? '1 day' : `${n} days`
}

/**
 * Calendar days since an instant, for running text.
 * @param t - The instant, in epoch ms.
 * @param now - Current time in epoch ms.
 * @return 'today', 'yesterday' or '9 days ago'.
 */
export function relativeDays(t: number, now: number): string {
  const d = Math.max(0, daysBetween(t, now))
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  return `${d} days ago`
}

/**
 * Capitalises the first letter, for labels that start a cell.
 * @param s - The text.
 * @return The text with an uppercase first letter.
 */
export function upperFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Short date as the design writes it, with names in the user's language.
 * @param t - The instant, in epoch ms.
 * @param locale - BCP 47 locale; the page's language by default.
 * @return e.g. 'Sat 10 Oct'.
 */
export function shortDate(t: number, locale?: string): string {
  const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(t)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('weekday')} ${part('day')} ${part('month')}`.replace(/[.,]/g, '')
}

/**
 * The meta line under a note's title in Review.
 * @param note - Creation and edit times, and word count.
 * @param now - Current time in epoch ms.
 * @return e.g. 'Created 16 days ago · Last edited 9 days ago · 86 words'.
 */
export function noteMeta(note: { createdAt: number; updatedAt: number; words: number }, now: number): string {
  const words = note.words === 1 ? '1 word' : `${note.words} words`
  return `Created ${relativeDays(note.createdAt, now)} · Last edited ${relativeDays(note.updatedAt, now)} · ${words}`
}
