<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { addDays } from '@/shared/time'
import Button from '@/components/ui/Button.vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import { MAX_KEEP_DAYS, parseCustomKeep } from '@/lib/review/keep'

const props = defineProps<{
  /** Current time in epoch ms. */
  now: number
}>()

const emit = defineEmits<{ keep: [until: number]; close: [] }>()

const root = ref<HTMLElement | null>(null)
const daysInput = ref<HTMLInputElement | null>(null)
const days = ref('')
const date = ref('')
const error = ref('')

const INPUT = 'h-7 rounded-md bg-surface px-2 text-[12px] text-primary inset-ring inset-ring-border-strong outline-none placeholder:text-tertiary'

/**
 * A yyyy-mm-dd string for a date input bound.
 * @param t - Instant in epoch ms.
 * @return The local date in ISO form.
 */
function isoDate(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const minDate = computed(() => isoDate(addDays(props.now, 1)))
const maxDate = computed(() => isoDate(addDays(props.now, MAX_KEEP_DAYS)))

/** Validates the entry and emits the return date. */
function submit(): void {
  const result = parseCustomKeep(days.value.trim() || date.value, props.now)
  if ('error' in result) {
    error.value = result.error
    return
  }
  emit('keep', result.until)
}

/**
 * Closes when the pointer goes down outside the form.
 * @param e - The pointerdown event.
 */
function onOutside(e: PointerEvent): void {
  if (!root.value?.contains(e.target as Node)) emit('close')
}

onMounted(async () => {
  document.addEventListener('pointerdown', onOutside, true)
  await nextTick()
  daysInput.value?.focus()
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
</script>

<template>
  <form
    ref="root"
    role="dialog"
    aria-label="Keep for a custom length"
    class="flex w-[260px] flex-col gap-2.5 rounded-[10px] bg-popover p-3 font-sans leading-[normal] shadow-popover inset-ring inset-ring-border-strong"
    @submit.prevent="submit"
    @keydown.esc.stop.prevent="emit('close')"
  >
    <span class="text-[10px] font-semibold tracking-[0.8px] text-tertiary uppercase">Keep for</span>
    <div class="flex items-center gap-2">
      <input
        ref="daysInput"
        v-model="days"
        inputmode="numeric"
        placeholder="Days"
        aria-label="Days"
        class="w-16"
        :class="[INPUT, FOCUS_RING]"
        @input="(date = ''), (error = '')"
      />
      <span class="text-[12px] text-tertiary">or</span>
      <input
        v-model="date"
        type="date"
        aria-label="Date"
        :min="minDate"
        :max="maxDate"
        class="min-w-0 flex-1"
        :class="[INPUT, FOCUS_RING]"
        @input="(days = ''), (error = '')"
      />
    </div>
    <p v-if="error" role="alert" class="m-0 text-[12px] text-stale">{{ error }}</p>
    <div class="flex justify-end gap-2">
      <Button @click="emit('close')">Cancel</Button>
      <Button variant="strong" type="submit">Keep</Button>
    </div>
  </form>
</template>
