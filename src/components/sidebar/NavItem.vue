<script setup lang="ts">
import type { Component } from 'vue'
import { FOCUS_RING_INSET } from '@/lib/ui/focus'

defineProps<{
  /** Lucide icon component. */
  icon: Component
  /** Destination name, e.g. "Review". */
  label: string
  /** Count on the right; hidden when zero. */
  count: number
  /** Stale tone colours the icon and count orange. */
  stale?: boolean
  /** The view is showing. */
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex h-8 w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left font-sans leading-[normal]"
    :class="[FOCUS_RING_INSET, active ? 'bg-surface' : 'hover:bg-surface/60']"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click')"
  >
    <component :is="icon" :size="15" class="shrink-0" :class="stale ? 'text-stale' : 'text-secondary'" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate text-[13px] text-secondary">{{ label }}</span>
    <span v-if="count" class="text-[12px] font-medium" :class="stale ? 'text-stale' : 'text-tertiary'">{{ count }}</span>
  </button>
</template>
