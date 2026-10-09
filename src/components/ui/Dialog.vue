<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from './Button.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    /** Primary button label; omit for a single dismiss button. */
    confirmLabel?: string
    /** Dismiss button label. */
    cancelLabel?: string
  }>(),
  { cancelLabel: 'OK' },
)

const emit = defineEmits<{ confirm: []; close: [] }>()

const root = ref<HTMLElement | null>(null)

onMounted(() => root.value?.querySelector<HTMLButtonElement>('[data-default]')?.focus())

/**
 * Esc closes; Tab stays between the dialog's buttons.
 * @param e - The keydown event.
 */
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
  } else if (e.key === 'Tab') {
    const buttons = [...(root.value?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    e.preventDefault()
    buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4" @mousedown.self="emit('close')">
    <div
      ref="root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
      class="flex w-[360px] max-w-full flex-col gap-1.5 rounded-xl bg-popover p-5 font-sans leading-[normal] shadow-dialog inset-ring inset-ring-border-strong"
      @keydown="onKeydown"
    >
      <h2 id="dialog-title" class="text-[15px] font-semibold text-primary">{{ title }}</h2>
      <p id="dialog-message" class="text-[13px] leading-[1.5] text-secondary">{{ message }}</p>
      <div class="mt-4 flex justify-end gap-2">
        <Button :data-default="confirmLabel ? undefined : ''" @click="emit('close')">{{ cancelLabel }}</Button>
        <Button v-if="confirmLabel" variant="primary" data-default @click="emit('confirm')">{{ confirmLabel }}</Button>
      </div>
    </div>
  </div>
</template>
