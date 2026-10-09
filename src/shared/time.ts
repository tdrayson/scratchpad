export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * Local midnight at the start of the day containing an instant.
 * @param t - Instant in epoch ms.
 * @return Epoch ms of that day's local midnight.
 */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Adds whole calendar days in local time, keeping the wall-clock time across DST changes.
 * @param t - Starting instant in epoch ms.
 * @param days - Days to add; negative moves back.
 * @return The shifted instant in epoch ms.
 */
export function addDays(t: number, days: number): number {
  const d = new Date(t)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

/**
 * Whole calendar days from one instant to another.
 * @param a - Earlier instant in epoch ms.
 * @param b - Later instant in epoch ms.
 * @return Calendar days from `a` to `b`; negative if `b` is earlier.
 */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY)
}
