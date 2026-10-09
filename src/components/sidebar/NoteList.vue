<script setup lang="ts">
import { computed, ref } from 'vue'
import { ageLabel } from '@/shared/lifecycle'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import NoteRow from '@/components/sidebar/NoteRow.vue'
import type { SidebarSection } from '@/lib/sidebar/sections'

const props = defineProps<{
  /** Non-empty sections in display order. */
  sections: SidebarSection[]
  /** The note shown as selected, if any. */
  selectedId: string | null
  /** Current time in epoch ms, for ages. */
  now: number
}>()

const emit = defineEmits<{ open: [id: string] }>()

const root = ref<HTMLElement | null>(null)
const focusedId = ref<string | null>(null)

const ids = computed(() => props.sections.flatMap((s) => s.notes.map((n) => n.id)))
/** The one row reachable by Tab: the last focused, else the selected, else the first. */
const tabId = computed(() => [focusedId.value, props.selectedId].find((id) => id && ids.value.includes(id)) ?? ids.value[0])

/**
 * Moves focus between rows with ↑ and ↓.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.altKey || e.metaKey || e.ctrlKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return
  const rows = [...(root.value?.querySelectorAll<HTMLElement>('[data-row]') ?? [])]
  const i = rows.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  e.preventDefault()
  rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus()
}
</script>

<template>
  <nav ref="root" aria-label="Notes" class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2" @keydown="onKey">
    <template v-for="(section, i) in sections" :key="section.id">
      <SectionLabel :tone="section.stale ? 'stale' : 'default'" class="shrink-0 px-2.5 pb-1.5" :class="i === 0 ? 'pt-1' : 'pt-3.5'">
        {{ section.label }}
        <template v-if="section.trailing" #trailing>{{ section.trailing }}</template>
      </SectionLabel>
      <NoteRow
        v-for="note in section.notes"
        :key="note.id"
        data-row
        :tabindex="note.id === tabId ? 0 : -1"
        :title="note.title"
        :preview="note.preview"
        :age="ageLabel(note.updatedAt, now)"
        :stale="section.stale"
        :selected="note.id === selectedId"
        @focus="focusedId = note.id"
        @open="emit('open', note.id)"
      />
    </template>
  </nav>
</template>
