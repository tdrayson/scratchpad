/** At or below this many days left, the countdown turns orange. */
export const PURGE_WARN_DAYS = 3

/**
 * Countdown text for the Deletes in column.
 * @param days - Days until deletion.
 * @return 'Today', '1 day' or 'n days'.
 */
export function purgeLabel(days: number): string {
  if (days <= 0) return 'Today'
  return days === 1 ? '1 day' : `${days} days`
}

/**
 * How full the countdown bar is.
 * @param days - Days until deletion.
 * @param archiveDays - Days archived notes are kept.
 * @return Fraction of the archive period remaining, 0–1.
 */
export function purgeFraction(days: number, archiveDays: number): number {
  if (archiveDays <= 0) return 0
  return Math.min(1, Math.max(0, days / archiveDays))
}

/**
 * Whether deletion is close enough to warn about.
 * @param days - Days until deletion.
 * @return True at three days or fewer.
 */
export function purgeSoon(days: number): boolean {
  return days <= PURGE_WARN_DAYS
}

/**
 * Index to move to with the arrow keys, clamped to the list.
 * @param index - Current index, or -1 for none.
 * @param step - -1 for up, 1 for down.
 * @param length - Number of rows.
 * @return The new index, or -1 if the list is empty.
 */
export function stepIndex(index: number, step: -1 | 1, length: number): number {
  if (!length) return -1
  if (index < 0) return step === 1 ? 0 : length - 1
  return Math.min(length - 1, Math.max(0, index + step))
}
