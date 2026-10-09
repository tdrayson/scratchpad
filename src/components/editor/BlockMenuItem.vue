<script setup lang="ts">
import type { BlockDef } from '@/lib/editor/blocks'

defineProps<{
  /** The block this row inserts. */
  block: BlockDef
  /** Keyboard-highlighted row. */
  selected?: boolean
}>()

const emit = defineEmits<{ select: []; hover: [] }>()
</script>

<template>
  <div
    role="option"
    :aria-selected="selected"
    class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 font-sans leading-[normal]"
    :class="selected && 'bg-popover-selected'"
    @mousedown.prevent
    @mousemove="emit('hover')"
    @click="emit('select')"
  >
    <span class="flex size-7 shrink-0 items-center justify-center rounded-md bg-bg inset-ring inset-ring-border">
      <component :is="block.icon" :size="14" :class="selected ? 'text-primary' : 'text-secondary'" aria-hidden="true" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-px">
      <span class="text-[13px] font-medium whitespace-nowrap text-primary">{{ block.title }}</span>
      <span class="text-[11px] whitespace-nowrap text-tertiary">{{ block.desc }}</span>
    </span>
    <span v-if="block.hint" class="font-mono text-[11px] text-tertiary" aria-hidden="true">{{ block.hint }}</span>
  </div>
</template>
