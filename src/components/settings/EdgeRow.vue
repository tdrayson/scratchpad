<script setup lang="ts">
import { computed } from 'vue'
import type { SunAnchor, SunEdge } from '@/shared/types'
import Select from '@/components/ui/Select.vue'
import SettingsRow from '@/components/ui/SettingsRow.vue'
import OffsetSelect from './OffsetSelect.vue'
import { ANCHOR_OPTIONS, edgeDescription, timeOptions, withAnchor } from '@/lib/settings/schedule'

const props = defineProps<{
  /** Row label: "Light from" or "Dark from". */
  title: string
  /** Today's sunrise and sunset, in minutes after midnight. */
  sun: { sunrise: number; sunset: number }
  /** The edge's time today, in minutes after midnight. */
  resolved: number
}>()

const edge = defineModel<SunEdge>({ required: true })

const anchor = computed({
  get: () => edge.value.anchor,
  set: (a: SunAnchor) => (edge.value = withAnchor(edge.value, a, props.resolved)),
})
const offset = computed({
  get: () => edge.value.offset,
  set: (o: number) => (edge.value = { ...edge.value, offset: o }),
})
const time = computed({
  get: () => edge.value.time,
  set: (t: number) => (edge.value = { ...edge.value, time: t }),
})

const base = computed(() => (edge.value.anchor === 'sunrise' ? props.sun.sunrise : props.sun.sunset))
const times = computed(() => timeOptions(edge.value.time))
</script>

<template>
  <SettingsRow :title="title" :description="edgeDescription(edge, resolved)">
    <Select v-model="anchor" :options="ANCHOR_OPTIONS" :label="`${title} anchor`" />
    <Select v-if="edge.anchor === 'fixed'" v-model="time" :options="times" :label="`${title} time`" />
    <OffsetSelect v-else v-model="offset" :base="base" :label="`${title} offset`" />
  </SettingsRow>
</template>
