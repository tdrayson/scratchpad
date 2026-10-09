<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { FOCUS_RING } from '@/lib/ui/focus'
import Tooltip from './Tooltip.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Lucide icon component. */
    icon: Component
    /** Accessible name and tooltip text. */
    label: string
    /** Shortcut id whose combo the tooltip shows. */
    shortcut?: string
    /** Pressed/on state, e.g. sidebar shown. */
    active?: boolean
    /** Icon size in px: 16 in toolbars, 14 in row actions. */
    iconSize?: number
    /** Tertiary icon colour, as on row actions like Delete. */
    muted?: boolean
    /** Disables the button. */
    disabled?: boolean
  }>(),
  { iconSize: 16 },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const { shortcuts } = useSettings()
const combo = computed(() => (props.shortcut ? shortcuts.value[props.shortcut] : undefined))
</script>

<template>
  <Tooltip :text="label" :combo="combo" :disabled="disabled">
    <button
      v-bind="$attrs"
      type="button"
      :aria-label="label"
      :aria-pressed="active || undefined"
      :disabled="disabled"
      class="inline-flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-surface-hover hover:text-primary disabled:pointer-events-none disabled:opacity-40"
      :class="[FOCUS_RING, active ? 'bg-surface text-primary' : muted ? 'text-tertiary' : 'text-secondary']"
      @click="emit('click', $event)"
    >
      <component :is="icon" :size="iconSize" aria-hidden="true" />
    </button>
  </Tooltip>
</template>
