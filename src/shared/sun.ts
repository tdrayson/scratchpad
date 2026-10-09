import * as SunCalc from 'suncalc'
import type { SunEdge } from './types'
import { MINUTE, startOfDay } from './time'

export interface Coords {
  lat: number
  lng: number
}

/** Used when the sun never rises or sets (polar day/night) or no location is known. */
const FALLBACK = { sunrise: 7 * 60, sunset: 19 * 60 }

/**
 * Minutes after local midnight, clamped to the day.
 * @param t - Instant in epoch ms.
 * @param day - That day's local midnight in epoch ms.
 * @return Minute of day, 0–1440.
 */
const toMinutes = (t: number, day: number): number => Math.min(24 * 60, Math.max(0, Math.round((t - day) / MINUTE)))

/**
 * Sunrise and sunset for a day, falling back to 07:00/19:00 without a location or in polar day/night.
 * @param date - Any instant on the day, in epoch ms.
 * @param coords - Where to calculate for, or null if unknown.
 * @return Sunrise and sunset in minutes after local midnight.
 */
export function sunTimes(date: number, coords: Coords | null): { sunrise: number; sunset: number } {
  if (!coords) return FALLBACK
  const day = startOfDay(date)
  const t = SunCalc.getTimes(new Date(day + 12 * 60 * MINUTE), coords.lat, coords.lng)
  const rise = t.sunrise?.getTime() ?? NaN
  const set = t.sunset?.getTime() ?? NaN
  if (Number.isNaN(rise) || Number.isNaN(set)) return FALLBACK
  return { sunrise: toMinutes(rise, day), sunset: toMinutes(set, day) }
}

/**
 * Resolves a schedule edge to a time of day.
 * @param edge - The anchor and offset.
 * @param date - Any instant on the day, in epoch ms.
 * @param coords - Where to calculate the sun for, or null if unknown.
 * @return Minutes after local midnight.
 */
export function edgeMinutes(edge: SunEdge, date: number, coords: Coords | null): number {
  if (edge.anchor === 'fixed') return edge.time
  const sun = sunTimes(date, coords)
  const m = (edge.anchor === 'sunrise' ? sun.sunrise : sun.sunset) + edge.offset
  return ((m % 1440) + 1440) % 1440
}

export interface Daylight {
  light: number
  dark: number
}

/**
 * The light window for a day.
 * @param lightFrom - Edge where light mode starts.
 * @param darkFrom - Edge where dark mode starts.
 * @param date - Any instant on the day, in epoch ms.
 * @param coords - Where to calculate the sun for, or null if unknown.
 * @return Start of light and start of dark, in minutes after midnight.
 */
export function daylight(lightFrom: SunEdge, darkFrom: SunEdge, date: number, coords: Coords | null): Daylight {
  return { light: edgeMinutes(lightFrom, date, coords), dark: edgeMinutes(darkFrom, date, coords) }
}

/**
 * Whether a time of day falls in the light window, which may wrap past midnight.
 * @param m - Minute of day.
 * @param window - The light window.
 * @return True when light mode applies.
 */
export function inLight(m: number, window: Daylight): boolean {
  const { light, dark } = window
  if (light === dark) return true
  return light < dark ? m >= light && m < dark : m >= light || m < dark
}

/**
 * Whether the Sunset theme should be light.
 * @param now - Current time in epoch ms.
 * @param lightFrom - Edge where light mode starts.
 * @param darkFrom - Edge where dark mode starts.
 * @param coords - Where to calculate the sun for, or null if unknown.
 * @return True for light, false for dark.
 */
export function isLightAt(now: number, lightFrom: SunEdge, darkFrom: SunEdge, coords: Coords | null): boolean {
  const m = Math.floor((now - startOfDay(now)) / MINUTE)
  return inLight(m, daylight(lightFrom, darkFrom, now, coords))
}

/**
 * Minutes until the Sunset theme next switches.
 * @param now - Current time in epoch ms.
 * @param lightFrom - Edge where light mode starts.
 * @param darkFrom - Edge where dark mode starts.
 * @param coords - Where to calculate the sun for, or null if unknown.
 * @return Minutes until the next switch, 1–1440.
 */
export function minutesUntilFlip(now: number, lightFrom: SunEdge, darkFrom: SunEdge, coords: Coords | null): number {
  const { light, dark } = daylight(lightFrom, darkFrom, now, coords)
  const m = Math.floor((now - startOfDay(now)) / MINUTE)
  const next = inLight(m, { light, dark }) ? dark : light
  return (next - m + 1440) % 1440 || 1440
}

/**
 * Formats a minute of day as a 24-hour clock time.
 * @param m - Minute of day.
 * @return e.g. '07:05'.
 */
export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60) % 24
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Formats a duration for the theme countdown.
 * @param m - Duration in minutes.
 * @return e.g. '4h 26m' or '45m'.
 */
export function formatDuration(m: number): string {
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m % 60}m`
}
