import type { Note } from './types'
import { addDays, daysBetween, DAY, HOUR, MINUTE, startOfDay } from './time'

type Dated = Pick<Note, 'updatedAt' | 'keptUntil' | 'archivedAt'>

export type Group = 'today' | 'week' | 'earlier' | 'stale' | 'archived'

/**
 * When a note becomes stale: its last edit plus the stale period, or a later Keep date.
 * @param note - The note's lifecycle dates.
 * @param staleDays - Days after the last edit before a note goes stale.
 * @return Epoch ms at which the note turns stale.
 */
export function staleAt(note: Dated, staleDays: number): number {
  return Math.max(addDays(note.updatedAt, staleDays), note.keptUntil ?? 0)
}

/**
 * Whether a note is stale and so belongs in Going stale and Review.
 * @param note - The note's lifecycle dates.
 * @param staleDays - Days after the last edit before a note goes stale.
 * @param now - Current time in epoch ms.
 * @return True when the note is unarchived and past its stale date.
 */
export function isStale(note: Dated, staleDays: number, now: number): boolean {
  return note.archivedAt === null && now >= staleAt(note, staleDays)
}

/**
 * Sidebar group for a note.
 * @param note - The note's lifecycle dates.
 * @param staleDays - Days after the last edit before a note goes stale.
 * @param now - Current time in epoch ms.
 * @return The group the note is listed under.
 */
export function groupOf(note: Dated, staleDays: number, now: number): Group {
  if (note.archivedAt !== null) return 'archived'
  if (isStale(note, staleDays, now)) return 'stale'
  if (note.updatedAt >= startOfDay(now)) return 'today'
  return daysBetween(note.updatedAt, now) < 7 ? 'week' : 'earlier'
}

/**
 * Compact age for list rows.
 * @param t - The instant being described, in epoch ms.
 * @param now - Current time in epoch ms.
 * @return 'Now', '5m', '3h' or '2d'.
 */
export function ageLabel(t: number, now: number): string {
  const d = now - t
  if (d < MINUTE) return 'Now'
  if (d < HOUR) return `${Math.floor(d / MINUTE)}m`
  if (d < DAY) return `${Math.floor(d / HOUR)}h`
  return `${Math.floor(d / DAY)}d`
}

/**
 * Whole days since a note was last edited, for the stale badge.
 * @param note - The note's last-edit date.
 * @param now - Current time in epoch ms.
 * @return Days since the edit, never negative.
 */
export function ageDays(note: Pick<Note, 'updatedAt'>, now: number): number {
  return Math.max(0, Math.floor((now - note.updatedAt) / DAY))
}

/**
 * Stale notes in the order Review walks them: oldest edit first.
 * @param notes - Notes to filter.
 * @param staleDays - Days after the last edit before a note goes stale.
 * @param now - Current time in epoch ms.
 * @return The stale subset, oldest first.
 */
export function reviewQueue<T extends Dated>(notes: T[], staleDays: number, now: number): T[] {
  return notes.filter((n) => isStale(n, staleDays, now)).sort((a, b) => a.updatedAt - b.updatedAt)
}

export interface KeepOption {
  days: number
  label: string
  until: number
}

export const KEEP_PRESETS = [1, 3, 7, 14, 30]

/**
 * Human label for a Keep length.
 * @param days - Keep length in days.
 * @return '1 day', '3 days', '2 weeks' or '1 month'.
 */
export function keepLabel(days: number): string {
  if (days === 14) return '2 weeks'
  if (days === 30) return '1 month'
  return days === 1 ? '1 day' : `${days} days`
}

/**
 * The preset Keep lengths, each with the date the note comes back.
 * @param now - Current time in epoch ms.
 * @return One option per preset.
 */
export function keepOptions(now: number): KeepOption[] {
  return KEEP_PRESETS.map((days) => ({ days, label: keepLabel(days), until: keepUntil(now, days) }))
}

/**
 * The instant a kept note returns to Review.
 * @param now - Current time in epoch ms.
 * @param days - Keep length in days.
 * @return Epoch ms of local midnight `days` from now.
 */
export function keepUntil(now: number, days: number): number {
  return startOfDay(addDays(now, days))
}

/**
 * When an archived note is permanently deleted.
 * @param archivedAt - When the note was archived, in epoch ms.
 * @param archiveDays - Days archived notes are kept.
 * @return Epoch ms of deletion.
 */
export function purgeAt(archivedAt: number, archiveDays: number): number {
  return addDays(archivedAt, archiveDays)
}

/**
 * Calendar days left before an archived note is deleted.
 * @param archivedAt - When the note was archived, in epoch ms.
 * @param archiveDays - Days archived notes are kept.
 * @param now - Current time in epoch ms.
 * @return Days remaining; 0 on the final day.
 */
export function daysUntilPurge(archivedAt: number, archiveDays: number, now: number): number {
  return Math.max(0, daysBetween(now, purgeAt(archivedAt, archiveDays)))
}

/**
 * Whether an archived note is due for permanent deletion.
 * @param note - The note's lifecycle dates.
 * @param archiveDays - Days archived notes are kept.
 * @param now - Current time in epoch ms.
 * @return True when the note is archived and past its deletion date.
 */
export function isPurgeable(note: Dated, archiveDays: number, now: number): boolean {
  return note.archivedAt !== null && now >= purgeAt(note.archivedAt, archiveDays)
}
