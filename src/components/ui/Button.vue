<script setup lang="ts">
import { computed, type Component } from 'vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import Kbd from './Kbd.vue'

const props = withDefaults(
  defineProps<{
    /** default: outlined, secondary text · strong: stronger outline, primary text · primary: filled light · filled: popover-selected fill (toast Undo) · danger: strong outline, stale text. */
    variant?: 'default' | 'strong' | 'primary' | 'filled' | 'danger'
    /** sm: 28px toolbar button · lg: 38px action button (Review). */
    size?: 'sm' | 'lg'
    /** Leading Lucide icon. */
    icon?: Component
    /** Combo shown as an inline keycap after the label, e.g. 'e'. */
    kbd?: string
    /** Native button type. */
    type?: 'button' | 'submit'
    /** Disables the button. */
    disabled?: boolean
  }>(),
  { variant: 'default', size: 'sm', type: 'button' },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const classes = computed(() => {
  const size =
    props.size === 'lg'
      ? 'h-[38px] gap-2.5 rounded-lg pr-2.5 pl-3.5 text-[13px]'
      : 'h-7 gap-2 rounded-md pr-2 pl-2.5 text-[12px]'
  const variant = {
    default: 'inset-ring inset-ring-border text-secondary hover:bg-surface-hover hover:text-primary',
    strong: 'inset-ring inset-ring-border-strong text-primary hover:bg-surface-hover',
    primary: 'bg-primary text-bg hover:opacity-90',
    filled: 'bg-popover-selected text-primary font-semibold hover:bg-border-strong',
    danger: 'inset-ring inset-ring-border-strong text-stale hover:bg-surface-hover',
  }[props.variant]
  return [size, variant]
})

const iconClass = computed(() =>
  props.variant === 'primary' ? 'text-bg' : props.variant === 'strong' ? 'text-secondary' : '',
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex shrink-0 items-center font-sans leading-[normal] font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-40"
    :class="[classes, FOCUS_RING]"
    @click="emit('click', $event)"
  >
    <component :is="icon" v-if="icon" :size="size === 'lg' ? 15 : 14" :class="iconClass" aria-hidden="true" />
    <span><slot /></span>
    <Kbd v-if="kbd" :combo="kbd" :tone="variant === 'primary' ? 'inverse' : 'default'" aria-hidden="true" />
  </button>
</template>
