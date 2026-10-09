<script setup lang="ts" generic="T">
import { ChevronsUpDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import MenuSeparator from './MenuSeparator.vue'
import type { Option } from '@/lib/ui/types'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** Choices, in display order. */
  options: Option<T>[]
  /** Accessible name for the trigger. */
  label?: string
  /** Trigger text when the value matches no option. */
  placeholder?: string
  /** Disables the select. */
  disabled?: boolean
}>()

const model = defineModel<T>()

const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)

const current = computed(() => props.options.find((o) => Object.is(o.value, model.value)))

/**
 * Picks an option and closes the menu.
 * @param value - The chosen value.
 */
function pick(value: T): void {
  model.value = value
  open.value = false
}

/**
 * Opens the menu from the keyboard, as a native popup button does.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
    e.preventDefault()
    open.value = true
  }
}
</script>

<template>
  <button
    ref="trigger"
    v-bind="$attrs"
    type="button"
    :aria-label="label"
    aria-haspopup="menu"
    :aria-expanded="open"
    :disabled="disabled"
    class="inline-flex h-7 shrink-0 items-center gap-2 rounded-md bg-surface pr-2 pl-2.5 font-sans text-[13px] leading-[normal] whitespace-nowrap text-primary inset-ring hover:bg-surface-hover disabled:opacity-40"
    :class="[FOCUS_RING, open ? 'inset-ring-border-strong' : 'inset-ring-border']"
    @click="open = !open"
    @keydown="onKey"
  >
    <span :class="{ 'text-tertiary': !current }">{{ current?.label ?? placeholder }}</span>
    <ChevronsUpDown :size="12" class="text-tertiary" aria-hidden="true" />
  </button>
  <Menu :open="open" :anchor="trigger" :label="label" align="end" @close="open = false">
    <MenuItem
      v-for="(o, i) in options"
      :key="i"
      selectable
      :checked="Object.is(o.value, model)"
      :detail="o.detail"
      @select="pick(o.value)"
    >
      {{ o.label }}
    </MenuItem>
    <template v-if="$slots.footer">
      <MenuSeparator />
      <slot name="footer" />
    </template>
  </Menu>
</template>
