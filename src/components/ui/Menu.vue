<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Whether the menu is shown. */
    open: boolean
    /** Element the menu drops from; focus returns here on close. */
    anchor: HTMLElement | null
    /** Align the menu's left (start) or right (end) edge with the anchor's. */
    align?: 'start' | 'end'
    /** Accessible name for the menu. */
    label?: string
  }>(),
  { align: 'start' },
)

const emit = defineEmits<{ close: [] }>()

const GAP = 4
const EDGE = 8
const TYPEAHEAD_RESET = 600

const panel = ref<HTMLElement | null>(null)
const pos = ref({ top: 0, left: 0, maxHeight: 0 })
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Enabled items in DOM order.
 * @return The focusable menu items.
 */
function items(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])
}

/**
 * Focuses an item by index, wrapping around the ends.
 * @param i - Target index.
 */
function focusAt(i: number): void {
  const list = items()
  if (!list.length) return
  list[(i + list.length) % list.length].focus()
}

/**
 * Closes the menu.
 * @param refocus - Return focus to the anchor (keyboard close or selection).
 */
function close(refocus: boolean): void {
  emit('close')
  if (refocus) props.anchor?.focus()
}

/** Positions the panel under the anchor, flipping above and clamping to stay in the window. */
function place(): void {
  if (!panel.value || !props.anchor) return
  const r = props.anchor.getBoundingClientRect()
  const { offsetWidth: w, offsetHeight: h } = panel.value
  const below = innerHeight - r.bottom - GAP - EDGE
  const above = r.top - GAP - EDGE
  const flip = h > below && above > below
  const left = props.align === 'end' ? r.right - w : r.left
  pos.value = {
    top: flip ? Math.max(EDGE, r.top - GAP - h) : r.bottom + GAP,
    left: Math.min(Math.max(left, EDGE), innerWidth - w - EDGE),
    maxHeight: flip ? above : below,
  }
}

/**
 * An item's label text for type-ahead matching.
 * @param el - The menu item.
 * @return Lowercased label.
 */
function labelOf(el: HTMLElement): string {
  return (el.querySelector('[data-menu-label]')?.textContent ?? el.textContent ?? '').trim().toLowerCase()
}

/**
 * Jumps to the next item whose label starts with the typed characters.
 * @param ch - The character just typed.
 */
function typeahead(ch: string): void {
  clearTimeout(typedTimer)
  typed += ch.toLowerCase()
  typedTimer = setTimeout(() => (typed = ''), TYPEAHEAD_RESET)
  const list = items()
  const from = list.indexOf(document.activeElement as HTMLElement)
  const ordered = [...list.slice(from + (typed.length === 1 ? 1 : 0)), ...list.slice(0, from + 1)]
  ordered.find((el) => labelOf(el).startsWith(typed))?.focus()
}

/**
 * Roving focus, activation, type-ahead and dismissal.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  const list = items()
  const i = list.indexOf(document.activeElement as HTMLElement)
  const keys: Record<string, () => void> = {
    ArrowDown: () => focusAt(i + 1),
    ArrowUp: () => focusAt(i < 0 ? -1 : i - 1),
    Home: () => focusAt(0),
    End: () => focusAt(-1),
    Enter: () => list[i]?.click(),
    ' ': () => list[i]?.click(),
    Escape: () => close(true),
    Tab: () => close(true),
  }
  if (keys[e.key]) {
    e.preventDefault()
    e.stopPropagation()
    keys[e.key]()
  } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
    typeahead(e.key)
  }
}

/**
 * Closes after an item is chosen; the item's own click handler has already run.
 * @param e - The click event.
 */
function onClick(e: MouseEvent): void {
  const item = (e.target as HTMLElement).closest('[role^="menuitem"]')
  if (item && item.getAttribute('aria-disabled') !== 'true') close(true)
}

/**
 * Moves focus with the pointer so hover and keyboard share one highlight.
 * @param e - The mousemove event.
 */
function onMove(e: MouseEvent): void {
  const item = (e.target as HTMLElement).closest<HTMLElement>('[role^="menuitem"]')
  if (item && item.getAttribute('aria-disabled') !== 'true' && document.activeElement !== item) item.focus()
}

/**
 * Closes when the pointer goes down outside the menu and its anchor.
 * @param e - The pointerdown event.
 */
function onOutside(e: PointerEvent): void {
  const t = e.target as Node
  if (!panel.value?.contains(t) && !props.anchor?.contains(t)) close(false)
}

/** Reposition while open (window resize). */
function onResize(): void {
  place()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      document.removeEventListener('pointerdown', onOutside, true)
      removeEventListener('resize', onResize)
      return
    }
    await nextTick()
    place()
    const list = items()
    ;(list.find((el) => el.getAttribute('aria-checked') === 'true') ?? list[0])?.focus()
    document.addEventListener('pointerdown', onOutside, true)
    addEventListener('resize', onResize)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimeout(typedTimer)
  document.removeEventListener('pointerdown', onOutside, true)
  removeEventListener('resize', onResize)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panel"
      role="menu"
      :aria-label="label"
      v-bind="$attrs"
      class="pop-in fixed z-50 flex min-w-[220px] flex-col gap-px overflow-y-auto rounded-[10px] bg-popover p-1 font-sans leading-[normal] shadow-popover outline-none inset-ring inset-ring-border-strong"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px`, maxHeight: `${pos.maxHeight}px` }"
      @keydown="onKey"
      @click="onClick"
      @mousemove="onMove"
    >
      <slot />
    </div>
  </Teleport>
</template>
