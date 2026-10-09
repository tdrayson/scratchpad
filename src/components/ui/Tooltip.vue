<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { formatCombo } from '@/shared/shortcuts'

type Placement = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(
  defineProps<{
    /** Tooltip label. */
    text: string
    /** Shortcut combo shown muted after the label, e.g. 'cmd+e'. */
    combo?: string
    /** Preferred side of the trigger; flips when there is no room. */
    placement?: Placement
    /** Suppresses the tooltip. */
    disabled?: boolean
  }>(),
  { placement: 'bottom' },
)

const DELAY = 400
const GAP = 6
const EDGE = 8

const wrap = ref<HTMLElement | null>(null)
const tip = ref<HTMLElement | null>(null)
const open = ref(false)
const pos = ref({ top: 0, left: 0 })
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * The element the tooltip points at: the slotted trigger, since the wrapper has no box.
 * @return The trigger element, or null before mount.
 */
function trigger(): HTMLElement | null {
  return (wrap.value?.firstElementChild as HTMLElement | null) ?? null
}

/**
 * Shows the tooltip, after the hover delay unless immediate.
 * @param immediate - Skip the delay (keyboard focus).
 */
function show(immediate = false): void {
  if (props.disabled) return
  clearTimeout(timer)
  timer = setTimeout(
    async () => {
      open.value = true
      await nextTick()
      place()
    },
    immediate ? 0 : DELAY,
  )
}

/** Hides the tooltip and cancels a pending show. */
function hide(): void {
  clearTimeout(timer)
  open.value = false
}

/**
 * Coordinates for the tooltip on one side of the trigger.
 * @param side - Which side to place it.
 * @param r - The trigger's rect.
 * @param w - Tooltip width.
 * @param h - Tooltip height.
 * @return Top/left in viewport pixels.
 */
function coords(side: Placement, r: DOMRect, w: number, h: number): { top: number; left: number } {
  if (side === 'bottom') return { top: r.bottom + GAP, left: r.left + r.width / 2 - w / 2 }
  if (side === 'top') return { top: r.top - GAP - h, left: r.left + r.width / 2 - w / 2 }
  if (side === 'left') return { top: r.top + r.height / 2 - h / 2, left: r.left - GAP - w }
  return { top: r.top + r.height / 2 - h / 2, left: r.right + GAP }
}

/** Positions the tooltip, flipping to the opposite side and clamping to stay in the window. */
function place(): void {
  const el = trigger()
  if (!el || !tip.value) return
  const r = el.getBoundingClientRect()
  const { offsetWidth: w, offsetHeight: h } = tip.value
  const flip: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
  let p = coords(props.placement, r, w, h)
  const out = p.top < EDGE || p.left < EDGE || p.top + h > innerHeight - EDGE || p.left + w > innerWidth - EDGE
  if (out) p = coords(flip[props.placement], r, w, h)
  pos.value = {
    top: Math.min(Math.max(p.top, EDGE), innerHeight - h - EDGE),
    left: Math.min(Math.max(p.left, EDGE), innerWidth - w - EDGE),
  }
}

/**
 * Starts the hover delay when the pointer enters the trigger from outside.
 * @param e - The mouseover event.
 */
function onOver(e: MouseEvent): void {
  if (!wrap.value?.contains(e.relatedTarget as Node | null)) show()
}

/**
 * Hides when the pointer leaves the trigger entirely.
 * @param e - The mouseout event.
 */
function onOut(e: MouseEvent): void {
  if (!wrap.value?.contains(e.relatedTarget as Node | null)) hide()
}

/**
 * Shows straight away for keyboard focus, not for mouse-click focus.
 * @param e - The focusin event.
 */
function onFocus(e: FocusEvent): void {
  const target = e.target as HTMLElement
  try {
    if (target.matches(':focus-visible')) show(true)
  } catch {
    show(true)
  }
}

/**
 * Hides on Escape.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    ref="wrap"
    class="contents"
    @mouseover="onOver"
    @mouseout="onOut"
    @focusin="onFocus"
    @focusout="hide"
    @pointerdown="hide"
    @keydown="onKey"
  >
    <slot />
  </span>
  <Teleport to="body">
    <div
      v-if="open"
      ref="tip"
      role="tooltip"
      class="pointer-events-none fixed z-50 flex items-center gap-2 rounded-md bg-primary py-[5px] pl-[9px] font-sans text-[12px] leading-[normal] font-medium whitespace-nowrap text-bg shadow-tooltip"
      :class="combo ? 'pr-1.5' : 'pr-[9px]'"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
    >
      <span>{{ text }}</span>
      <span v-if="combo" class="text-on-primary-muted">{{ formatCombo(combo) }}</span>
    </div>
  </Teleport>
</template>
