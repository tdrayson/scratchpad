<script setup lang="ts">
import type { Component } from 'vue'
import Kbd from '@/components/ui/Kbd.vue'

defineProps<{
  /** Lucide icon component. */
  icon: Component
  /** Action label, e.g. "Start review". */
  label: string
  /** Combo shown on the right; omitted when the shortcut is unassigned. */
  combo?: string
  /** Highlighted by keyboard or pointer. */
  selected?: boolean
}>()
</script>

<template>
  <div
    class="flex h-9 cursor-default items-center gap-3 rounded-[7px] px-2.5 font-sans leading-[normal]"
    :class="selected && 'bg-popover-selected'"
  >
    <component :is="icon" :size="16" class="shrink-0" :class="selected ? 'text-primary' : 'text-tertiary'" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate text-[13px]" :class="selected ? 'text-primary' : 'text-secondary'">{{ label }}</span>
    <Kbd v-if="combo" :combo="combo" />
  </div>
</template>
