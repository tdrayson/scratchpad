import { computed, type WritableComputedRef } from 'vue'
import { useSettings } from '@/composables/useSettings'
import type { Settings } from '@/shared/types'
import { withOverride, withoutOverrides } from './overrides'

/**
 * Two-way binding for one setting; writes save immediately.
 * @param key - The setting to bind.
 * @return A ref for v-model.
 */
export function useSetting<K extends keyof Settings>(key: K): WritableComputedRef<Settings[K]> {
  const { settings, update } = useSettings()
  return computed({
    get: () => settings.value[key],
    set: (v) => void update({ [key]: v } as Partial<Settings>),
  })
}

/**
 * Reads and writes shortcut combos. Quick capture also has an on/off switch: clearing it turns it off.
 * @return Lookup, change, and reset helpers.
 */
export function useShortcutEditor() {
  const { settings, shortcuts, update } = useSettings()

  /**
   * The combo a recorder shows.
   * @param id - Shortcut id.
   * @return The effective combo, or '' when unset or turned off.
   */
  function comboFor(id: string): string {
    if (id === 'quickCapture' && !settings.value.quickCapture) return ''
    return shortcuts.value[id] ?? ''
  }

  /**
   * Saves a new combo for a shortcut.
   * @param id - Shortcut id.
   * @param combo - The new combo; '' clears it.
   */
  function setCombo(id: string, combo: string): void {
    if (id === 'quickCapture' && !combo) return void update({ quickCapture: false })
    const patch: Partial<Settings> = { shortcuts: withOverride(settings.value.shortcuts, id, combo) }
    if (id === 'quickCapture') patch.quickCapture = true
    void update(patch)
  }

  /**
   * Whether any of the shortcuts differ from their defaults.
   * @param ids - Shortcut ids.
   * @return True when a reset would change something.
   */
  function isChanged(...ids: string[]): boolean {
    if (ids.includes('quickCapture') && !settings.value.quickCapture) return true
    return ids.some((id) => id in settings.value.shortcuts)
  }

  /**
   * Returns shortcuts to their defaults.
   * @param ids - Shortcut ids.
   */
  function reset(...ids: string[]): void {
    const patch: Partial<Settings> = { shortcuts: withoutOverrides(settings.value.shortcuts, ids) }
    if (ids.includes('quickCapture')) patch.quickCapture = true
    void update(patch)
  }

  return { comboFor, setCombo, isChanged, reset }
}
