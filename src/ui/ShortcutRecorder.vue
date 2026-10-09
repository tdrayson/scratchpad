<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { pauseShortcuts } from '../composables/useShortcuts'
import { useSettings } from '../composables/useSettings'
import { SHORTCUTS, comboFromEvent, validateCombo, type ComboProblem } from '../shared/shortcuts'
import { FOCUS_RING } from './focus'
import Kbd from './Kbd.vue'

const props = defineProps<{
  /** Shortcut id being edited (see SHORTCUTS). */
  id: string
  /** Accessible name, e.g. the shortcut's label. */
  label?: string
}>()

const combo = defineModel<string>({ default: '' })

const { shortcuts } = useSettings()
const recording = ref(false)
const problem = ref<ComboProblem | null>(null)
let resume: (() => void) | null = null

const message = computed(() => {
  const p = problem.value
  if (!p) return ''
  if (p.kind === 'reserved') return 'Reserved by macOS'
  if (p.kind === 'noModifier') return 'Needs a modifier key'
  return `Used by “${SHORTCUTS.find((s) => s.id === p.with)?.label ?? p.with}”`
})

/** Starts listening for the next combo, with app shortcuts paused. */
function start(): void {
  if (recording.value) return
  recording.value = true
  resume = pauseShortcuts()
  window.addEventListener('keydown', onKey, { capture: true })
}

/** Stops listening, drops any error, and resumes app shortcuts. */
function stop(): void {
  recording.value = false
  problem.value = null
  window.removeEventListener('keydown', onKey, { capture: true })
  resume?.()
  resume = null
}

/**
 * Handles a key while recording: Esc cancels, bare Backspace clears, anything else is validated.
 * @param e - The keyboard event.
 */
function onKey(e: KeyboardEvent): void {
  e.preventDefault()
  e.stopPropagation()
  const next = comboFromEvent(e)
  if (!next) return
  if (next === 'escape') return stop()
  if (next === 'backspace') {
    combo.value = ''
    return stop()
  }
  problem.value = validateCombo(props.id, next, shortcuts.value)
  if (problem.value) return
  combo.value = next
  stop()
}

onBeforeUnmount(stop)
</script>

<template>
  <span class="inline-flex items-center gap-2.5 font-sans leading-[normal]">
    <span v-if="message" role="alert" class="text-[12px] text-stale">{{ message }}</span>
    <button
      type="button"
      :aria-label="label ? `${label} shortcut` : 'Shortcut'"
      :aria-pressed="recording"
      class="inline-flex h-[26px] shrink-0 items-center gap-1 rounded-md bg-surface px-1.5 inset-ring hover:bg-surface-hover"
      :class="[FOCUS_RING, recording ? 'inset-ring-border-strong' : 'inset-ring-border']"
      @click="start"
      @blur="stop"
    >
      <span v-if="recording" class="px-1 text-[11px] text-tertiary">Press keys…</span>
      <Kbd v-else-if="combo" :combo="combo" split tone="strong" />
      <span v-else class="px-1 text-[11px] text-tertiary">None</span>
    </button>
  </span>
</template>
