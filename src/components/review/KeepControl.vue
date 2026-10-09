<script setup lang="ts">
import { Timer } from '@lucide/vue'
import { computed, ref } from 'vue'
import { keepUntil } from '@/shared/lifecycle'
import Menu from '@/components/ui/Menu.vue'
import MenuItem from '@/components/ui/MenuItem.vue'
import MenuSeparator from '@/components/ui/MenuSeparator.vue'
import SplitButton from '@/components/ui/SplitButton.vue'
import { keepButtonLabel, keepMenuOptions } from '@/lib/review/keep'
import KeepCustom from './KeepCustom.vue'

const props = defineProps<{
  /** Current time in epoch ms. */
  now: number
  /** The user's default Keep length in days. */
  keepDays: number
}>()

const emit = defineEmits<{ keep: [until: number] }>()

const split = ref<InstanceType<typeof SplitButton> | null>(null)
const menuOpen = ref(false)
const customOpen = ref(false)

const anchor = computed(() => split.value?.more ?? null)
const options = computed(() => keepMenuOptions(props.now, props.keepDays))

/** Keeps for the default length. */
function keepDefault(): void {
  emit('keep', keepUntil(props.now, props.keepDays))
}

/**
 * Keeps until a chosen date and closes any open form.
 * @param until - Return instant in epoch ms.
 */
function choose(until: number): void {
  customOpen.value = false
  emit('keep', until)
}

/** Closes the custom form and returns focus to the chevron. */
function closeCustom(): void {
  customOpen.value = false
  anchor.value?.focus()
}

/** Opens the Keep menu, as the chevron does. */
function openMenu(): void {
  menuOpen.value = true
}

defineExpose({
  /** Opens the Keep menu. */
  openMenu,
  /** Whether the menu or custom form is open, so page keys stand aside. */
  busy: computed(() => menuOpen.value || customOpen.value),
})
</script>

<template>
  <div class="relative">
    <SplitButton
      ref="split"
      :icon="Timer"
      kbd="k"
      menu-label="Keep for…"
      :expanded="menuOpen"
      @main="keepDefault"
      @menu="menuOpen = !menuOpen"
    >
      {{ keepButtonLabel(keepDays) }}
    </SplitButton>
    <Menu :open="menuOpen" :anchor="anchor" align="end" label="Keep for" class="w-[260px]" @close="menuOpen = false">
      <div class="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-[0.8px] text-tertiary uppercase" aria-hidden="true">
        Keep for
      </div>
      <MenuItem
        v-for="o in options"
        :key="o.days"
        selectable
        :checked="o.days === keepDays"
        :detail="o.detail"
        @select="choose(o.value)"
      >
        {{ o.label }}
      </MenuItem>
      <MenuSeparator />
      <MenuItem selectable detail="days or date" @select="customOpen = true">Custom…</MenuItem>
    </Menu>
    <KeepCustom v-if="customOpen" :now="now" class="absolute top-full right-0 z-40 mt-1" @keep="choose" @close="closeCustom" />
  </div>
</template>
