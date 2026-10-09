<script setup lang="ts">
import { ChevronsUpDown } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import Menu from '@/components/ui/Menu.vue'
import MenuItem from '@/components/ui/MenuItem.vue'
import MenuSeparator from '@/components/ui/MenuSeparator.vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import { CUSTOM_OFFSETS, PRESET_OFFSETS, offsetOptions, offsetShort } from '@/lib/settings/schedule'

const props = defineProps<{
  /** The anchor's time today, in minutes after midnight, for resolving each option. */
  base: number
  /** Accessible name for the trigger. */
  label?: string
}>()

const offset = defineModel<number>({ required: true })

const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const custom = ref(false)

const options = computed(() => offsetOptions(props.base, custom.value ? CUSTOM_OFFSETS : PRESET_OFFSETS))

/** Opens the menu, on the full list when the current offset isn't a preset. */
function show(): void {
  custom.value = !PRESET_OFFSETS.includes(offset.value)
  open.value = true
}

/** Switches to the 15-minute list; the menu closes on any pick, so it reopens once that settles. */
async function showCustom(): Promise<void> {
  custom.value = true
  await nextTick()
  open.value = true
}

/**
 * Opens from the keyboard, as a native popup button does.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  show()
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    :aria-label="label"
    aria-haspopup="menu"
    :aria-expanded="open"
    class="inline-flex h-7 shrink-0 items-center gap-2 rounded-md bg-surface pr-2 pl-2.5 font-sans text-[13px] leading-[normal] whitespace-nowrap text-primary inset-ring hover:bg-surface-hover"
    :class="[FOCUS_RING, open ? 'inset-ring-border-strong' : 'inset-ring-border']"
    @click="open ? (open = false) : show()"
    @keydown="onKey"
  >
    <span>{{ offsetShort(offset) }}</span>
    <ChevronsUpDown :size="12" class="text-tertiary" aria-hidden="true" />
  </button>
  <Menu :open="open" :anchor="trigger" :label="label" align="end" class="w-[250px]" @close="open = false">
    <MenuItem
      v-for="o in options"
      :key="o.value"
      selectable
      :checked="o.value === offset"
      :detail="o.detail"
      @select="offset = o.value"
    >
      {{ o.label }}
    </MenuItem>
    <template v-if="!custom">
      <MenuSeparator />
      <MenuItem selectable detail="15 min steps" @select="showCustom">Custom offset…</MenuItem>
    </template>
  </Menu>
</template>
