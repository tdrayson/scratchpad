import type { Settings } from '@/shared/types'
import type { Option } from '@/lib/ui/types'

type Reminder = Settings['reminder']

/** 'off', 'daily', or a weekday number as a string (0 = Sunday). */
export type ReminderChoice = string

const PLURAL_DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']

/** Weekdays in menu order, Monday first. */
const WEEK = [1, 2, 3, 4, 5, 6, 0]

/** Reminder times offered, in minutes after midnight. */
export const REMINDER_TIMES = [7, 8, 9, 10, 12, 14, 17, 18].map((h) => h * 60)

/**
 * A time of day as the reminder shows it, without a leading zero.
 * @param m - Minutes after midnight.
 * @return e.g. '9:00' or '17:30'.
 */
export function clockLabel(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

/**
 * The menu choice a reminder setting corresponds to.
 * @param r - The reminder setting.
 * @return 'off', 'daily' or the weekday as a string.
 */
export function reminderChoice(r: Reminder): ReminderChoice {
  if (!r.enabled) return 'off'
  return r.day === null ? 'daily' : String(r.day)
}

/**
 * Applies a menu choice to a reminder, keeping its time.
 * @param r - The current reminder.
 * @param choice - 'off', 'daily' or a weekday string.
 * @return The new reminder.
 */
export function applyChoice(r: Reminder, choice: ReminderChoice): Reminder {
  if (choice === 'off') return { ...r, enabled: false }
  return { ...r, enabled: true, day: choice === 'daily' ? null : Number(choice) }
}

/**
 * The label for a schedule at a time.
 * @param choice - 'off', 'daily' or a weekday string.
 * @param time - Minutes after midnight.
 * @return e.g. 'Off', 'Every day, 9:00' or 'Mondays, 9:00'.
 */
function choiceLabel(choice: ReminderChoice, time: number): string {
  if (choice === 'off') return 'Off'
  const days = choice === 'daily' ? 'Every day' : PLURAL_DAYS[Number(choice)]
  return `${days}, ${clockLabel(time)}`
}

/**
 * The trigger label for a reminder.
 * @param r - The reminder setting.
 * @return e.g. 'Mondays, 9:00'.
 */
export function reminderLabel(r: Reminder): string {
  return choiceLabel(reminderChoice(r), r.time)
}

/**
 * Schedule choices, each labelled with the reminder's current time.
 * @param time - Minutes after midnight.
 * @return Off, Every day, then each weekday from Monday.
 */
export function reminderOptions(time: number): Option<ReminderChoice>[] {
  return ['off', 'daily', ...WEEK.map(String)].map((c) => ({ value: c, label: choiceLabel(c, time) }))
}
