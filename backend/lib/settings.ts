import type { Database } from 'tjs:sqlite'
import { DEFAULT_SETTINGS } from '../../src/shared/defaults'
import type { Settings } from '../../src/shared/types'
import { all, run } from './db'

export class SettingsStore {
  /**
   * @param db - The open notes database.
   */
  constructor(private db: Database) {}

  /**
   * Current settings, with defaults filled in for anything never saved.
   * @return The settings.
   */
  get(): Settings {
    const row = all(this.db, "SELECT value FROM settings WHERE key = 'settings'")[0]
    const saved = row ? (JSON.parse(row.value) as Partial<Settings>) : {}
    return { ...DEFAULT_SETTINGS, ...saved }
  }

  /**
   * Saves changed settings.
   * @param patch - The settings to change.
   * @return The settings after the change.
   */
  update(patch: Partial<Settings>): Settings {
    const next = { ...this.get(), ...patch }
    run(this.db, "INSERT OR REPLACE INTO settings (key, value) VALUES ('settings', ?)", JSON.stringify(next))
    return next
  }

  /**
   * Reads an internal value that isn't a user setting, such as the last reminder day.
   * @param key - Value name.
   * @return The stored value, or null.
   */
  meta(key: string): string | null {
    return all(this.db, 'SELECT value FROM settings WHERE key = ?', `meta:${key}`)[0]?.value ?? null
  }

  /**
   * Stores an internal value that isn't a user setting.
   * @param key - Value name.
   * @param value - Value to store.
   */
  setMeta(key: string, value: string): void {
    run(this.db, 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', `meta:${key}`, value)
  }
}
