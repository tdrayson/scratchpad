import { keepLabel, keepOptions, keepUntil } from '@/shared/lifecycle'
import { startOfDay } from '@/shared/time'
import type { Option } from '@/lib/ui/types'
import { shortDate } from './format'

/** Longest custom Keep, in days. */
export const MAX_KEEP_DAYS = 365

export type CustomKeep = { until: number } | { error: string }

/**
 * Keep presets as menu options, with the return date and the default marked.
 * @param now - Current time in epoch ms.
 * @param defaultDays - The user's default Keep length.
 * @param locale - Locale for the dates.
 * @return One option per preset; value is the return instant.
 */
export function keepMenuOptions(now: number, defaultDays: number, locale?: string): (Option<number> & { days: number })[] {
  return keepOptions(now).map((o) => ({
    value: o.until,
    days: o.days,
    label: o.label,
    detail: o.days === defaultDays ? `Default · ${shortDate(o.until, locale)}` : shortDate(o.until, locale),
  }))
}

/**
 * Label for the main Keep button.
 * @param days - The default Keep length.
 * @return e.g. 'Keep 7 days' or 'Keep 2 weeks'.
 */
export function keepButtonLabel(days: number): string {
  return `Keep ${keepLabel(days)}`
}

/**
 * Reads a custom Keep entry: a number of days, or a yyyy-mm-dd date from a date input.
 * @param value - What the user entered.
 * @param now - Current time in epoch ms.
 * @return The return instant, or why the entry can't be used.
 */
export function parseCustomKeep(value: string, now: number): CustomKeep {
  const v = value.trim()
  if (/^\d+$/.test(v)) {
    const days = Number(v)
    if (days < 1 || days > MAX_KEEP_DAYS) return { error: `Enter 1 to ${MAX_KEEP_DAYS} days.` }
    return { until: keepUntil(now, days) }
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return { error: 'Enter a number of days or a date.' }
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (date.getMonth() !== Number(m[2]) - 1) return { error: 'That date doesn’t exist.' }
  const until = startOfDay(date.getTime())
  if (until <= startOfDay(now)) return { error: 'Pick a date after today.' }
  if (until > keepUntil(now, MAX_KEEP_DAYS)) return { error: 'Pick a date within a year.' }
  return { until }
}
