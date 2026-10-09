<script setup lang="ts">
import { FOCUS_RING } from '@/lib/ui/focus'

defineProps<{
  /** Accessible name when no visible label is associated. */
  label?: string
  /** Disables the switch. */
  disabled?: boolean
}>()

const on = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="on"
    :aria-label="label"
    :disabled="disabled"
    class="flex h-5 w-[34px] shrink-0 items-center rounded-[10px] p-0.5 transition-colors disabled:opacity-40"
    :class="[FOCUS_RING, on ? 'bg-primary' : 'bg-border-strong']"
    @click="on = !on"
  >
    <span class="size-4 rounded-full bg-bg transition-transform" :class="on ? 'translate-x-3.5' : 'translate-x-0'" />
  </button>
</template>
