import { computed, ref } from 'vue'
import { call, on } from '../lib/api'
import { DEFAULT_SETTINGS } from '../shared/defaults'
import { resolveShortcuts } from '../shared/shortcuts'
import type { Settings } from '../shared/types'

const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
let loaded: Promise<void> | null = null

/**
 * Shared, live app settings. Changes made in any window reach every window.
 * @return The settings, effective shortcuts, and loader/updater.
 */
export function useSettings() {
  /**
   * Loads settings from the backend once and subscribes to changes.
   * @return Resolves when settings are loaded.
   */
  function load(): Promise<void> {
    loaded ??= call('getSettings').then((s) => {
      settings.value = s
      on<Settings>('settings-changed', (next) => (settings.value = next))
    })
    return loaded
  }

  /**
   * Saves changed settings.
   * @param patch - The settings to change.
   * @return Resolves with the settings after the change.
   */
  async function update(patch: Partial<Settings>): Promise<Settings> {
    settings.value = { ...settings.value, ...patch }
    return (settings.value = await call('updateSettings', patch))
  }

  const shortcuts = computed(() => resolveShortcuts(settings.value.shortcuts))

  return { settings, shortcuts, load, update }
}
