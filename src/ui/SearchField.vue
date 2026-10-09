<script setup lang="ts">
import { Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import { FOCUS_RING } from './focus'
import Kbd from './Kbd.vue'

const props = withDefaults(
  defineProps<{
    /** button: opens search elsewhere (sidebar) · input: a real text field bound with v-model. */
    mode?: 'button' | 'input'
    /** Placeholder text. */
    placeholder?: string
    /** Shortcut id whose combo shows as a keycap in button mode. */
    shortcut?: string
  }>(),
  { mode: 'button', placeholder: 'Search notes', shortcut: 'search' },
)

const emit = defineEmits<{ activate: [] }>()

const query = defineModel<string>({ default: '' })

const input = ref<HTMLInputElement | null>(null)
const { shortcuts } = useSettings()
const combo = computed(() => shortcuts.value[props.shortcut])

/** Focuses the text input (input mode). */
function focus(): void {
  input.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <button
    v-if="mode === 'button'"
    type="button"
    class="flex h-8 w-full items-center gap-2 rounded-[7px] bg-surface px-2.5 font-sans text-[13px] leading-[normal] text-tertiary hover:bg-surface-hover"
    :class="FOCUS_RING"
    @click="emit('activate')"
  >
    <Search :size="14" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate text-left">{{ placeholder }}</span>
    <Kbd v-if="combo" :combo="combo" aria-hidden="true" />
  </button>
  <label
    v-else
    class="flex h-8 w-full items-center gap-2 rounded-[7px] bg-surface px-2.5 font-sans text-[13px] leading-[normal] text-tertiary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tertiary"
  >
    <Search :size="14" aria-hidden="true" />
    <input
      ref="input"
      v-model="query"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="min-w-0 flex-1 bg-transparent text-primary caret-accent select-text outline-none placeholder:text-tertiary"
      @keydown.esc="query ? (query = '') : ($event.target as HTMLInputElement).blur()"
    />
  </label>
</template>
