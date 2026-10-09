export type ThemeMode = 'system' | 'light' | 'dark' | 'sunset'

export type SunAnchor = 'sunrise' | 'sunset' | 'fixed'

/** One edge of the Sunset schedule: an anchor plus an offset in minutes (negative = before). */
export interface SunEdge {
  anchor: SunAnchor
  /** Minutes after midnight, used when anchor is 'fixed'. */
  time: number
  offset: number
}

export interface Location {
  label: string
  lat: number
  lng: number
  /** True when derived from the system time zone rather than chosen. */
  auto: boolean
}

export interface Settings {
  theme: ThemeMode
  lightFrom: SunEdge
  darkFrom: SunEdge
  location: Location | null
  textSize: number
  quickCapture: boolean
  menuBarIcon: boolean
  launchAtLogin: boolean
  markdownShortcuts: boolean
  spellCheck: boolean
  staleDays: number
  keepDays: number
  /** Review reminder: `day` is a weekday (0 = Sunday) or null for every day; `time` is minutes after midnight. */
  reminder: { enabled: boolean; day: number | null; time: number }
  dockBadge: boolean
  archiveDays: number
  /** Put archived notes in an Archive folder when exporting. */
  exportArchived: boolean
  shortcuts: Record<string, string>
}

export interface Note {
  id: string
  title: string
  doc: string
  markdown: string
  createdAt: number
  updatedAt: number
  keptUntil: number | null
  archivedAt: number | null
}

/** A note without its document body, for lists. */
export type NoteSummary = Omit<Note, 'doc'> & { preview: string; words: number }

export interface NotePatch {
  id: string
  doc: string
  markdown: string
}

export interface SearchHit {
  note: NoteSummary
  /** Snippet with matches wrapped in \u0001 … \u0002 markers. */
  snippet: string
}
