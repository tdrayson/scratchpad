<script setup lang="ts">
import { Check } from '@lucide/vue'

const props = defineProps<{
  /** Reserves the leading check slot, for choice lists. */
  selectable?: boolean
  /** Shows the check (only with `selectable`). */
  checked?: boolean
  /** Right-aligned muted text, e.g. a date or time. */
  detail?: string
  /** Disables the item. */
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

/** Emits select unless disabled. */
function choose(): void {
  if (!props.disabled) emit('select')
}
</script>

<template>
  <div
    :role="selectable ? 'menuitemradio' : 'menuitem'"
    :aria-checked="selectable ? !!checked : undefined"
    :aria-disabled="disabled || undefined"
    tabindex="-1"
    class="flex h-[30px] shrink-0 items-center gap-2.5 rounded-md px-2.5 text-[13px] whitespace-nowrap text-primary outline-none focus:bg-popover-selected aria-disabled:opacity-40"
    @click="choose"
  >
    <span v-if="selectable" class="flex size-3.5 shrink-0 items-center justify-center">
      <Check v-if="checked" :size="14" aria-hidden="true" />
    </span>
    <span data-menu-label class="min-w-0 flex-1 truncate"><slot /></span>
    <span v-if="detail" class="text-[12px] text-tertiary">{{ detail }}</span>
  </div>
</template>
