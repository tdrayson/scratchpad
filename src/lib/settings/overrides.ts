import { SHORTCUTS } from '@/shared/shortcuts'

/**
 * Records a shortcut change as an override; a combo equal to the default drops the override.
 * @param overrides - The current overrides, keyed by shortcut id.
 * @param id - The shortcut being changed.
 * @param combo - The new combo; '' means none.
 * @return New overrides.
 */
export function withOverride(overrides: Record<string, string>, id: string, combo: string): Record<string, string> {
  const rest = withoutOverrides(overrides, [id])
  return SHORTCUTS.find((s) => s.id === id)?.default === combo ? rest : { ...rest, [id]: combo }
}

/**
 * Drops overrides so those shortcuts return to their defaults.
 * @param overrides - The current overrides, keyed by shortcut id.
 * @param ids - Shortcuts to reset.
 * @return New overrides.
 */
export function withoutOverrides(overrides: Record<string, string>, ids: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(overrides).filter(([id]) => !ids.includes(id)))
}
