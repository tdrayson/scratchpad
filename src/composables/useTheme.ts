import { computed, ref, watchEffect } from 'vue'
import { isLightAt } from '../shared/sun'
import type { Location } from '../shared/types'
import { locationForZone } from '../shared/tzCities'
import { useClock } from './useClock'
import { useSettings } from './useSettings'

const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => (systemDark.value = e.matches))

/**
 * The location Sunset uses: the chosen one, else one derived from the system time zone.
 * @return The effective location.
 */
export function useLocation() {
  const { settings } = useSettings()
  return computed<Location>(
    () => settings.value.location ?? locationForZone(Intl.DateTimeFormat().resolvedOptions().timeZone),
  )
}

/**
 * Applies the theme setting to the document as data-theme, re-evaluating Sunset as time passes.
 * @return Whether the effective theme is dark.
 */
export function useTheme() {
  const { settings } = useSettings()
  const { now } = useClock()
  const location = useLocation()

  const dark = computed(() => {
    const s = settings.value
    if (s.theme === 'dark') return true
    if (s.theme === 'light') return false
    if (s.theme === 'sunset') return !isLightAt(now.value, s.lightFrom, s.darkFrom, location.value)
    return systemDark.value
  })

  watchEffect(() => {
    document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  })

  return { dark }
}
