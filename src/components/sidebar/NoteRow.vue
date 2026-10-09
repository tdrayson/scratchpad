<script setup lang="ts">
import { FOCUS_RING_INSET } from '@/lib/ui/focus'

defineProps<{
  /** Note title; "Untitled" when empty. */
  title: string
  /** First line of body text. */
  preview: string
  /** Compact age, e.g. "3h". */
  age: string
  /** Stale rows dim the title and show the age in orange. */
  stale?: boolean
  /** The note open in the editor. */
  selected?: boolean
}>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full shrink-0 flex-col gap-[3px] rounded-md px-2.5 py-2 text-left font-sans leading-[normal]"
    :class="[FOCUS_RING_INSET, selected ? 'bg-surface' : 'hover:bg-surface/60']"
    :aria-current="selected || undefined"
    @click="emit('open')"
  >
    <span class="flex w-full items-center gap-2">
      <span class="min-w-0 flex-1 truncate text-[13px] font-medium" :class="stale ? 'text-secondary' : 'text-primary'">
        {{ title || 'Untitled' }}
      </span>
      <span class="text-[11px] whitespace-nowrap" :class="stale ? 'text-stale' : 'text-tertiary'">{{ age }}</span>
    </span>
    <span class="w-full truncate text-[12px] text-tertiary">{{ preview }}</span>
  </button>
</template>
