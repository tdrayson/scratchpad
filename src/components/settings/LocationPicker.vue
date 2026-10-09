<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useLocation } from '@/composables/useTheme'
import type { Location } from '@/shared/types'
import { knownCities, locationForZone } from '@/shared/tzCities'
import Menu from '@/components/ui/Menu.vue'
import MenuItem from '@/components/ui/MenuItem.vue'
import MenuSeparator from '@/components/ui/MenuSeparator.vue'
import { FOCUS_RING } from '@/lib/ui/focus'

const emit = defineEmits<{ coordinates: [] }>()

const { settings, update } = useSettings()
const location = useLocation()
const CITIES = knownCities()
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)

/**
 * Saves the location the Sunset schedule uses.
 * @param loc - The chosen location, or null to follow the time zone.
 */
function choose(loc: Location | null): void {
  void update({ location: loc })
}

/**
 * Whether a city is the saved location.
 * @param city - A city from the list.
 * @return True when it is the current choice.
 */
function isCurrent(city: Location): boolean {
  const l = settings.value.location
  return !!l && l.label === city.label && l.lat === city.lat && l.lng === city.lng
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-label="`Location: ${location.label}`"
    class="rounded-sm text-secondary underline-offset-2 hover:text-primary hover:underline"
    :class="FOCUS_RING"
    @click="open = !open"
  >
    {{ location.label }}
  </button>
  <Menu :open="open" :anchor="trigger" label="Location" class="w-[250px]" @close="open = false">
    <MenuItem selectable :checked="!settings.location" :detail="locationForZone(zone).label" @select="choose(null)">
      Use time zone (auto)
    </MenuItem>
    <MenuSeparator />
    <MenuItem v-for="c in CITIES" :key="c.label" selectable :checked="isCurrent(c)" @select="choose(c)">
      {{ c.label }}
    </MenuItem>
    <MenuSeparator />
    <MenuItem selectable :checked="!!settings.location && !CITIES.some(isCurrent)" @select="emit('coordinates')">
      Latitude &amp; longitude…
    </MenuItem>
  </Menu>
</template>
