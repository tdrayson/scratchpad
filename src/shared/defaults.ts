import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  lightFrom: { anchor: 'sunrise', time: 7 * 60, offset: 0 },
  darkFrom: { anchor: 'sunset', time: 19 * 60, offset: 0 },
  location: null,
  textSize: 15,
  quickCapture: true,
  menuBarIcon: true,
  launchAtLogin: false,
  markdownShortcuts: true,
  spellCheck: true,
  staleDays: 7,
  keepDays: 7,
  reminder: { enabled: true, day: 1, time: 9 * 60 },
  dockBadge: true,
  archiveDays: 30,
  shortcuts: {},
}
