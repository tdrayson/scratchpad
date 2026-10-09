<script setup lang="ts">
import { computed } from 'vue'
import type { Daylight } from '@/shared/sun'
import { segments, type Segment } from '@/lib/settings/schedule'

const props = defineProps<{
  /** Today's light window, in minutes after midnight. */
  light: Daylight
  /** Sunrise to sunset, drawn faintly behind the light window; null when the schedule ignores the sun. */
  sun: Daylight | null
  /** Current minute of the day. */
  now: number
}>()

const LABELS = ['00:00', '06:00', '12:00', '18:00', '24:00']

const day = computed(() => segments(props.light))
const sunSegments = computed(() => (props.sun ? segments(props.sun) : []))

/**
 * Positions a segment along the bar.
 * @param s - The segment.
 * @return Inline left and width.
 */
function place(s: Segment): Record<string, string> {
  return { left: `${s.from * 100}%`, width: `${s.width * 100}%` }
}
</script>

<template>
  <div class="flex flex-col gap-2 pt-0.5 pb-3.5 font-sans leading-[normal]">
    <div class="relative flex h-3 items-center" aria-hidden="true">
      <div class="relative h-1.5 w-full overflow-hidden rounded-[3px] bg-surface">
        <div v-for="(s, i) in sunSegments" :key="`s${i}`" class="absolute inset-y-0 bg-accent/30" :style="place(s)" />
        <div v-for="(s, i) in day" :key="`d${i}`" class="absolute inset-y-0 bg-accent" :style="place(s)" />
      </div>
      <div
        class="absolute top-0 size-3 rounded-full bg-primary outline-2 -outline-offset-1 outline-bg"
        :style="{ left: `clamp(0px, calc(${(now / 1440) * 100}% - 6px), calc(100% - 12px))` }"
      />
    </div>
    <div class="flex justify-between font-mono text-[10px] text-tertiary" aria-hidden="true">
      <span v-for="l in LABELS" :key="l">{{ l }}</span>
    </div>
    <div class="flex items-center gap-4 text-[12px]">
      <span class="min-w-0 flex-1 text-secondary"><slot name="info" /></span>
      <span class="whitespace-nowrap text-tertiary"><slot name="state" /></span>
    </div>
  </div>
</template>
