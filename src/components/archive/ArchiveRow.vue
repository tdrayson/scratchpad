<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { daysUntilPurge } from '@/shared/lifecycle'
import type { NoteSummary } from '@/shared/types'
import Button from '@/components/ui/Button.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { FOCUS_RING_INSET } from '@/lib/ui/focus'
import { relativeDays, upperFirst } from '@/lib/review/format'
import { purgeFraction, purgeLabel, purgeSoon } from '@/lib/archive/purge'

const props = defineProps<{
  /** The archived note. */
  note: NoteSummary
  /** Days archived notes are kept. */
  archiveDays: number
  /** Current time in epoch ms. */
  now: number
  /** Whether this row is the keyboard selection (sets the roving tabindex). */
  selected: boolean
}>()

const emit = defineEmits<{ restore: []; remove: []; focus: [] }>()

const el = ref<HTMLElement | null>(null)

const daysLeft = computed(() => daysUntilPurge(props.note.archivedAt!, props.archiveDays, props.now))
const soon = computed(() => purgeSoon(daysLeft.value))

/**
 * Restores on Enter when the row itself, not one of its buttons, has focus.
 * @param e - The keydown event.
 */
function onEnter(e: KeyboardEvent): void {
  if (e.target !== el.value) return
  e.preventDefault()
  emit('restore')
}
</script>

<template>
  <li
    ref="el"
    :tabindex="selected ? 0 : -1"
    :aria-label="note.title || 'Untitled'"
    class="group flex h-[60px] items-center gap-6 rounded-lg px-3 font-sans leading-[normal] hover:bg-surface focus-within:bg-surface"
    :class="FOCUS_RING_INSET"
    @focusin="emit('focus')"
    @keydown.enter="onEnter"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span class="truncate text-[13px] font-medium text-primary">{{ note.title || 'Untitled' }}</span>
      <span class="truncate text-[12px] text-tertiary">{{ note.preview }}</span>
    </div>
    <span class="w-24 shrink-0 text-[12px] text-secondary">{{ upperFirst(relativeDays(note.archivedAt!, now)) }}</span>
    <div class="flex w-[150px] shrink-0 items-center gap-2.5">
      <span class="h-1 w-[72px] overflow-hidden rounded-[2px] bg-border-strong" aria-hidden="true">
        <span
          class="block h-full rounded-[2px]"
          :class="soon ? 'bg-stale' : 'bg-secondary'"
          :style="{ width: `${purgeFraction(daysLeft, archiveDays) * 100}%` }"
        />
      </span>
      <span class="text-[12px] whitespace-nowrap" :class="soon ? 'font-medium text-stale' : 'text-secondary'">
        <span class="sr-only">Deletes in </span>{{ purgeLabel(daysLeft) }}
      </span>
    </div>
    <div
      class="flex w-[132px] shrink-0 items-center justify-end gap-1.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
    >
      <Button variant="strong" tabindex="-1" @click="emit('restore')">Restore</Button>
      <IconButton :icon="Trash2" label="Delete permanently" shortcut="deleteNote" :icon-size="14" muted tabindex="-1" @click="emit('remove')" />
    </div>
  </li>
</template>
