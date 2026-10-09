<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useLocation } from '@/composables/useTheme'
import Button from '@/components/ui/Button.vue'
import { FOCUS_RING } from '@/lib/ui/focus'

const emit = defineEmits<{ done: [] }>()

const { update } = useSettings()
const location = useLocation()
const lat = ref(String(location.value.lat))
const lng = ref(String(location.value.lng))
const first = ref<HTMLInputElement | null>(null)

/**
 * Parses a coordinate within a range.
 * @param s - The typed text.
 * @param limit - The absolute maximum (90 or 180).
 * @return The number, or null if invalid.
 */
function parse(s: string, limit: number): number | null {
  const n = Number(s.trim())
  return s.trim() && Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

const parsed = computed(() => ({ lat: parse(lat.value, 90), lng: parse(lng.value, 180) }))
const valid = computed(() => parsed.value.lat !== null && parsed.value.lng !== null)

/** Saves the typed coordinates as the location. */
function save(): void {
  const { lat: la, lng: ln } = parsed.value
  if (la === null || ln === null) return
  void update({ location: { label: `${la.toFixed(2)}, ${ln.toFixed(2)}`, lat: la, lng: ln, auto: false } })
  emit('done')
}

/**
 * Esc cancels the form without closing the window.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return
  e.preventDefault()
  emit('done')
}

onMounted(() => first.value?.focus())

const INPUT = 'h-7 w-[92px] rounded-md bg-surface px-2.5 text-[13px] text-primary inset-ring placeholder:text-tertiary'
</script>

<template>
  <form class="flex items-center gap-1.5 border-t border-border py-3 font-sans leading-[normal]" @submit.prevent="save" @keydown="onKey">
    <span class="flex-1 text-[13px] font-medium text-primary">Coordinates</span>
    <input
      ref="first"
      v-model="lat"
      inputmode="decimal"
      aria-label="Latitude"
      placeholder="Latitude"
      :class="[INPUT, FOCUS_RING, parsed.lat === null ? 'inset-ring-stale' : 'inset-ring-border']"
    />
    <input
      v-model="lng"
      inputmode="decimal"
      aria-label="Longitude"
      placeholder="Longitude"
      :class="[INPUT, FOCUS_RING, parsed.lng === null ? 'inset-ring-stale' : 'inset-ring-border']"
    />
    <Button @click="emit('done')">Cancel</Button>
    <Button type="submit" variant="strong" :disabled="!valid">Save</Button>
  </form>
</template>
