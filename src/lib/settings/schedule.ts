import { formatDuration, formatMinutes, type Daylight } from '@/shared/sun'
import type { SunAnchor, SunEdge } from '@/shared/types'
import type { Option } from '@/lib/ui/types'

const DAY_MINUTES = 1440

export const PRESET_OFFSETS = [-180, -120, -60, -30, 0, 30, 60, 120]

/** Every offset the custom list offers: ±3 h in 15-minute steps. */
export const CUSTOM_OFFSETS = Array.from({ length: 25 }, (_, i) => (i - 12) * 15)

export const ANCHOR_OPTIONS: Option<SunAnchor>[] = [
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'fixed', label: 'Fixed time' },
]

const HOUR_WORDS = ['', 'an hour', 'two hours', 'three hours']

/**
 * Wraps a minute count into one day.
 * @param m - Minutes, possibly negative or past midnight.
 * @return Minute of day, 0–1439.
 */
export function wrapDay(m: number): number {
  return ((m % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
}

/**
 * Compact hours-and-minutes for an unsigned offset.
 * @param m - Offset size in minutes, not negative.
 * @return e.g. '2 h', '30 min' or '1 h 15 min'.
 */
function span(m: number): string {
  const h = Math.floor(m / 60)
  const r = m % 60
  return [h && `${h} h`, r && `${r} min`].filter(Boolean).join(' ')
}

/**
 * Menu label for an offset.
 * @param m - Offset in minutes; negative is before.
 * @return e.g. 'On time', '2 h before', '30 min after'.
 */
export function offsetLabel(m: number): string {
  if (m === 0) return 'On time'
  return `${span(Math.abs(m))} ${m < 0 ? 'before' : 'after'}`
}

/**
 * Trigger label for an offset.
 * @param m - Offset in minutes; negative is before.
 * @return e.g. 'On time', '+1 h', '−2 h'.
 */
export function offsetShort(m: number): string {
  if (m === 0) return 'On time'
  return `${m < 0 ? '−' : '+'}${span(Math.abs(m))}`
}

/**
 * Offset spelled out for a sentence.
 * @param m - Offset size in minutes, not negative.
 * @return e.g. 'an hour', '30 minutes', 'two hours and 15 minutes'.
 */
function spoken(m: number): string {
  const h = Math.floor(m / 60)
  const r = m % 60
  return [HOUR_WORDS[h], r && `${r} minutes`].filter(Boolean).join(' and ')
}

/**
 * Offset choices, each showing the time it resolves to today.
 * @param base - The anchor's time today, in minutes after midnight.
 * @param offsets - Offsets to list, in minutes.
 * @return One option per offset.
 */
export function offsetOptions(base: number, offsets: number[]): Option<number>[] {
  return offsets.map((o) => ({ value: o, label: offsetLabel(o), detail: formatMinutes(wrapDay(base + o)) }))
}

/**
 * Fixed-time choices every 30 minutes, plus the current time if it is off that grid.
 * @param current - The edge's current fixed time, in minutes after midnight.
 * @return Options in time order.
 */
export function timeOptions(current: number): Option<number>[] {
  const grid = Array.from({ length: 48 }, (_, i) => i * 30)
  const times = grid.includes(current) ? grid : [...grid, current].sort((a, b) => a - b)
  return times.map((t) => ({ value: t, label: formatMinutes(t) }))
}

/**
 * Changes an edge's anchor; a switch to Fixed time starts from where the edge was today.
 * @param edge - The edge being changed.
 * @param anchor - The new anchor.
 * @param resolved - The edge's time today, in minutes after midnight.
 * @return The new edge.
 */
export function withAnchor(edge: SunEdge, anchor: SunAnchor, resolved: number): SunEdge {
  if (anchor !== 'fixed') return { ...edge, anchor }
  return { ...edge, anchor, time: wrapDay(Math.round(resolved / 30) * 30) }
}

/**
 * The row description under Light from / Dark from.
 * @param edge - The edge.
 * @param resolved - The edge's time today, in minutes after midnight.
 * @return e.g. '08:12 today — an hour after sunrise.'
 */
export function edgeDescription(edge: SunEdge, resolved: number): string {
  if (edge.anchor === 'fixed') return 'Every day. Ignores location.'
  const t = formatMinutes(resolved)
  if (edge.offset === 0) return `${t} today, at ${edge.anchor}.`
  return `${t} today — ${spoken(Math.abs(edge.offset))} ${edge.offset < 0 ? 'before' : 'after'} ${edge.anchor}.`
}

/**
 * The timeline caption, without the location.
 * @param lightFrom - Edge where light starts.
 * @param darkFrom - Edge where dark starts.
 * @param light - Today's light window.
 * @param sun - Today's sunrise and sunset, as a window.
 * @return The caption text, and whether the location applies.
 */
export function scheduleCaption(
  lightFrom: SunEdge,
  darkFrom: SunEdge,
  light: Daylight,
  sun: Daylight,
): { text: string; usesLocation: boolean } {
  const range = `Light ${formatMinutes(light.light)} – ${formatMinutes(light.dark)}`
  if (lightFrom.anchor === 'fixed' && darkFrom.anchor === 'fixed') return { text: `${range} every day`, usesLocation: false }
  if (light.light === sun.light && light.dark === sun.dark) return { text: `${range} today`, usesLocation: true }
  return { text: `${range} · sun ${formatMinutes(sun.light)} – ${formatMinutes(sun.dark)}`, usesLocation: true }
}

/**
 * The timeline's right-hand state line.
 * @param isLight - Whether it is light now.
 * @param untilFlip - Minutes until the next switch.
 * @return e.g. 'Light now · dark in 4h 26m'.
 */
export function stateLabel(isLight: boolean, untilFlip: number): string {
  const d = formatDuration(untilFlip)
  return isLight ? `Light now · dark in ${d}` : `Dark now · light in ${d}`
}

export interface Segment {
  /** Start, as a fraction of the day. */
  from: number
  /** Width, as a fraction of the day. */
  width: number
}

/**
 * Bar segments for a window that may wrap past midnight.
 * @param window - Start and end in minutes after midnight; equal means all day.
 * @return One segment, or two when the window wraps.
 */
export function segments(window: Daylight): Segment[] {
  const { light: a, dark: b } = window
  const seg = (from: number, to: number): Segment => ({ from: from / DAY_MINUTES, width: (to - from) / DAY_MINUTES })
  if (a === b) return [seg(0, DAY_MINUTES)]
  if (a < b) return [seg(a, b)]
  return [seg(a, DAY_MINUTES), seg(0, b)].filter((s) => s.width > 0)
}
