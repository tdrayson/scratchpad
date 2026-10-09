<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import type { Option } from '@/lib/ui/types'

const props = defineProps<{
  /** Segments, in display order. */
  options: Option<T>[]
  /** Accessible name for the group. */
  label?: string
}>()

const model = defineModel<T>()

const buttons = ref<HTMLButtonElement[]>([])
const selected = computed(() => props.options.findIndex((o) => Object.is(o.value, model.value)))

/**
 * Moves selection and focus with the arrow keys, wrapping at the ends.
 * @param e - The keydown event.
 * @param i - Index of the focused segment.
 */
function onKey(e: KeyboardEvent, i: number): void {
  const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  const step = steps[e.key]
  if (!step) return
  e.preventDefault()
  const next = (i + step + props.options.length) % props.options.length
  model.value = props.options[next].value
  buttons.value[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex shrink-0 gap-0.5 rounded-[7px] bg-surface p-0.5 font-sans text-[12px] leading-[normal] font-medium"
  >
    <button
      v-for="(o, i) in options"
      :key="i"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="i === selected"
      :tabindex="i === Math.max(selected, 0) ? 0 : -1"
      class="rounded-[5px] px-3 py-1 whitespace-nowrap"
      :class="[FOCUS_RING, i === selected ? 'bg-popover-selected text-primary' : 'text-tertiary hover:text-secondary']"
      @click="model = o.value"
      @keydown="onKey($event, i)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
