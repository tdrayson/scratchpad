export type SettingsPage = 'general' | 'review' | 'shortcuts'

export const PAGE_TITLES: Record<SettingsPage, string> = {
  general: 'General',
  review: 'Review & Archive',
  shortcuts: 'Shortcuts',
}

const STORAGE_KEY = 'settings.page'

/**
 * The page last shown, or General.
 * @return The page to open on.
 */
export function savedPage(): SettingsPage {
  try {
    const p = localStorage.getItem(STORAGE_KEY)
    return p && p in PAGE_TITLES ? (p as SettingsPage) : 'general'
  } catch {
    return 'general'
  }
}

/**
 * Remembers the page for next time the window opens.
 * @param page - The page shown.
 */
export function savePage(page: SettingsPage): void {
  try {
    localStorage.setItem(STORAGE_KEY, page)
  } catch {
    // Storage can be unavailable; the page then just opens on General.
  }
}
