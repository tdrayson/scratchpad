<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BlockMenuItem from '@/components/editor/BlockMenuItem.vue'
import type { SlashState } from '@/lib/editor/slash'

const props = defineProps<{
  /** Live slash-menu state from the editor. */
  state: SlashState
  /** Editor body text size in px, so the filter hint matches the typed text. */
  textSize: number
}>()

const GAP = 6
const EDGE = 8

const menu = ref<HTMLElement | null>(null)
const pos = ref({ top: 0, left: 0 })
const visible = computed(() => props.state.open && props.state.items.length > 0 && !!props.state.rect)

/** Places the menu under the typed `/`, or above it when there is no room below. */
async function place(): Promise<void> {
  await nextTick()
  const r = props.state.rect
  const el = menu.value
  if (!r || !el) return
  const h = el.offsetHeight
  const below = r.bottom + GAP
  const top = below + h > innerHeight - EDGE ? Math.max(EDGE, r.top - GAP - h) : below
  pos.value = { top, left: Math.min(Math.max(EDGE, r.left - 4), innerWidth - el.offsetWidth - EDGE) }
}

watch(() => [visible.value, props.state.rect, props.state.items.length], place, { deep: true })
watch(
  () => props.state.index,
  async (i) => {
    await nextTick()
    menu.value?.querySelectorAll('[role="option"]')[i]?.scrollIntoView({ block: 'nearest' })
  },
)
</script>

<template>
  <Teleport to="body">
    <span
      v-if="state.open && !state.query && state.rect"
      class="pointer-events-none fixed font-sans text-tertiary select-none"
      :style="{
        top: `${state.rect.top}px`,
        left: `${state.rect.right + 3}px`,
        height: `${state.rect.bottom - state.rect.top}px`,
        lineHeight: `${state.rect.bottom - state.rect.top}px`,
        fontSize: `${textSize}px`,
      }"
      aria-hidden="true"
    >
      Filter blocks…
    </span>
    <div
      v-if="visible"
      ref="menu"
      role="listbox"
      aria-label="Blocks"
      class="fixed z-40 flex max-h-[min(440px,calc(100vh-16px))] w-[300px] flex-col gap-px overflow-y-auto rounded-[10px] bg-popover p-1.5 font-sans shadow-popover inset-ring inset-ring-border-strong"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
    >
      <div class="px-2 pt-1.5 pb-1 text-[10px] leading-[normal] font-semibold tracking-[0.8px] text-tertiary">BLOCKS</div>
      <BlockMenuItem
        v-for="(block, i) in state.items"
        :key="block.id"
        :block="block"
        :selected="i === state.index"
        @hover="state.index = i"
        @select="state.choose(block)"
      />
    </div>
  </Teleport>
</template>
