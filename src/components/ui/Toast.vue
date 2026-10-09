<script setup lang="ts">
import { onBeforeUnmount, onMounted, type Component } from 'vue'
import Button from './Button.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Main message, e.g. Archived “Travelyst integration”. */
    message: string
    /** Muted detail after the message, e.g. "142 words". */
    detail?: string
    /** Leading Lucide icon. */
    icon?: Component
    /** Action button label, e.g. "Undo". */
    actionLabel?: string
    /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
    duration?: number
  }>(),
  { duration: 5000 },
)

const emit = defineEmits<{ action: []; dismiss: [] }>()

let timer: ReturnType<typeof setTimeout> | undefined

/** Starts (or restarts) the auto-dismiss countdown. */
function arm(): void {
  clearTimeout(timer)
  if (props.duration > 0) timer = setTimeout(() => emit('dismiss'), props.duration)
}

/** Pauses auto-dismiss while the pointer is over the toast. */
function hold(): void {
  clearTimeout(timer)
}

onMounted(arm)
onBeforeUnmount(hold)
</script>

<template>
  <div
    v-bind="$attrs"
    role="status"
    aria-live="polite"
    class="fixed bottom-6 left-1/2 z-40 flex h-11 -translate-x-1/2 items-center gap-3.5 rounded-[10px] bg-popover pr-2 pl-4 font-sans leading-[normal] whitespace-nowrap shadow-[0_10px_28px_var(--shadow)] inset-ring inset-ring-border-strong"
    @mouseenter="hold"
    @mouseleave="arm"
    @keydown.esc="emit('dismiss')"
  >
    <component :is="icon" v-if="icon" :size="14" class="text-secondary" aria-hidden="true" />
    <span class="text-[13px] text-primary">{{ message }}</span>
    <span v-if="detail" class="text-[12px] text-tertiary">{{ detail }}</span>
    <Button v-if="actionLabel" variant="filled" @click="emit('action')">{{ actionLabel }}</Button>
  </div>
</template>
