<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClock } from '@/composables/useClock'
import { useSettings } from '@/composables/useSettings'
import { useLocation } from '@/composables/useTheme'
import { daylight, isLightAt, minutesUntilFlip, sunTimes } from '@/shared/sun'
import { MINUTE, startOfDay } from '@/shared/time'
import type { SunEdge } from '@/shared/types'
import CoordinatesForm from './CoordinatesForm.vue'
import DaylightTimeline from './DaylightTimeline.vue'
import EdgeRow from './EdgeRow.vue'
import LocationPicker from './LocationPicker.vue'
import { scheduleCaption, stateLabel } from '@/lib/settings/schedule'

const { settings, update } = useSettings()
const { now } = useClock()
const location = useLocation()
const editingCoords = ref(false)

const sun = computed(() => sunTimes(now.value, location.value))
const light = computed(() => daylight(settings.value.lightFrom, settings.value.darkFrom, now.value, location.value))
const sunWindow = computed(() => ({ light: sun.value.sunrise, dark: sun.value.sunset }))
const caption = computed(() =>
  scheduleCaption(settings.value.lightFrom, settings.value.darkFrom, light.value, sunWindow.value),
)
const state = computed(() => {
  const { lightFrom, darkFrom } = settings.value
  const isLight = isLightAt(now.value, lightFrom, darkFrom, location.value)
  return stateLabel(isLight, minutesUntilFlip(now.value, lightFrom, darkFrom, location.value))
})
const nowMinute = computed(() => Math.floor((now.value - startOfDay(now.value)) / MINUTE))

/**
 * Saves one edge of the schedule.
 * @param key - Which edge.
 * @param edge - Its new value.
 */
function setEdge(key: 'lightFrom' | 'darkFrom', edge: SunEdge): void {
  void update({ [key]: edge })
}
</script>

<template>
  <EdgeRow
    title="Light from"
    :model-value="settings.lightFrom"
    :sun="sun"
    :resolved="light.light"
    @update:model-value="setEdge('lightFrom', $event)"
  />
  <EdgeRow
    title="Dark from"
    :model-value="settings.darkFrom"
    :sun="sun"
    :resolved="light.dark"
    @update:model-value="setEdge('darkFrom', $event)"
  />
  <DaylightTimeline :light="light" :sun="caption.usesLocation ? sunWindow : null" :now="nowMinute">
    <template #info>
      {{ caption.text }}
      <template v-if="caption.usesLocation">
        <span aria-hidden="true">&ensp;·&ensp;</span>
        <LocationPicker @coordinates="editingCoords = true" />
      </template>
    </template>
    <template #state>{{ state }}</template>
  </DaylightTimeline>
  <CoordinatesForm v-if="editingCoords" @done="editingCoords = false" />
</template>
