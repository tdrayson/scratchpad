<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { ref, type Component } from 'vue'
import { FOCUS_RING_INSET } from '@/lib/ui/focus'
import Kbd from './Kbd.vue'

defineProps<{
  /** Leading Lucide icon. */
  icon?: Component
  /** Combo shown as an inline keycap after the label. */
  kbd?: string
  /** Accessible name for the chevron part. */
  menuLabel?: string
  /** Whether the attached menu is open (sets aria-expanded). */
  expanded?: boolean
}>()

const emit = defineEmits<{ main: [e: MouseEvent]; menu: [e: MouseEvent] }>()

const more = ref<HTMLButtonElement | null>(null)

defineExpose({
  /** The chevron button, for anchoring a Menu. */
  more,
})
</script>

<template>
  <div
    class="inline-flex h-[38px] shrink-0 items-stretch overflow-hidden rounded-lg font-sans leading-[normal] outline-1 -outline-offset-1 outline-border-strong"
  >
    <button
      type="button"
      class="flex items-center gap-2.5 pr-2.5 pl-3.5 text-[13px] font-medium whitespace-nowrap text-primary hover:bg-surface-hover"
      :class="FOCUS_RING_INSET"
      @click="emit('main', $event)"
    >
      <component :is="icon" v-if="icon" :size="15" class="text-secondary" aria-hidden="true" />
      <span><slot /></span>
      <Kbd v-if="kbd" :combo="kbd" aria-hidden="true" />
    </button>
    <span class="w-px bg-border-strong" aria-hidden="true" />
    <button
      ref="more"
      type="button"
      :aria-label="menuLabel ?? 'More options'"
      aria-haspopup="menu"
      :aria-expanded="expanded ?? false"
      class="flex w-8 items-center justify-center bg-surface text-secondary hover:bg-surface-hover hover:text-primary"
      :class="FOCUS_RING_INSET"
      @click="emit('menu', $event)"
    >
      <ChevronDown :size="14" aria-hidden="true" />
    </button>
  </div>
</template>
