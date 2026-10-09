<script setup lang="ts">
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Copy,
  Hourglass,
  PanelLeft,
  Search,
  Settings,
  SquarePen,
  Trash2,
  type LucideIcon,
} from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useClock } from '@/composables/useClock'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import Kbd from '@/components/ui/Kbd.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import CommandItem from '@/components/palette/CommandItem.vue'
import { buildSections, NEW_NOTE_COMBO, NEW_NOTE_WITH_TEXT, type PaletteItem } from '@/lib/palette/palette'
import SearchResult from '@/components/palette/SearchResult.vue'
import { useSearch } from '@/lib/palette/useSearch'

const emit = defineEmits<{
  /** Palette dismissed, by Esc, scrim click or after running something. */
  close: []
  /** Run an action by shortcut id; `text` carries the query for "New note “…”". */
  action: [id: string, text?: string]
}>()

const ICONS: Record<string, LucideIcon> = {
  [NEW_NOTE_WITH_TEXT]: SquarePen,
  newNote: SquarePen,
  archiveNote: Archive,
  copyMarkdown: Copy,
  deleteNote: Trash2,
  prevNote: ArrowUp,
  nextNote: ArrowDown,
  toggleSidebar: PanelLeft,
  review: Hourglass,
  archive: Archive,
  settings: Settings,
}

const { active, open, restore } = useNotes()
const { settings, shortcuts } = useSettings()
const { now } = useClock()

const query = ref('')
const index = ref(0)
const input = ref<HTMLInputElement | null>(null)
const list = ref<HTMLElement | null>(null)
const { hits } = useSearch(query)
let returnFocus: HTMLElement | null = null

const sections = computed(() =>
  buildSections({ query: query.value, hits: hits.value, recent: active.value, now: now.value, archiveDays: settings.value.archiveDays }),
)
const items = computed(() => sections.value.flatMap((s) => s.items))
const selected = computed<PaletteItem | undefined>(() => items.value[index.value])

watch(query, () => (index.value = 0))
watch(items, (all) => (index.value = Math.min(index.value, Math.max(0, all.length - 1))))
watch(index, async () => {
  await nextTick()
  list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' })
})

/**
 * DOM id for an item, for aria-activedescendant.
 * @param item - The palette item.
 * @return A stable element id.
 */
function optionId(item: PaletteItem): string {
  return `palette-${item.key.replace(/[^\w-]/g, '_')}`
}

/**
 * Combo shown beside an action.
 * @param id - Action id.
 * @return The effective combo, or undefined if unassigned.
 */
function comboFor(id: string): string | undefined {
  return id === NEW_NOTE_WITH_TEXT ? NEW_NOTE_COMBO : shortcuts.value[id] || undefined
}

/**
 * Runs an item: opens a note, restores then opens an archived one, or hands an action to the shell.
 * @param item - The item to run.
 */
async function run(item: PaletteItem | undefined): Promise<void> {
  if (!item) return
  emit('close')
  if (item.kind === 'note') return open(item.note.id)
  if (item.kind === 'archived') {
    await restore(item.note.id)
    return open(item.note.id)
  }
  emit('action', item.action.id, item.text)
}

/**
 * Moves the selection, wrapping at either end.
 * @param by - -1 for up, 1 for down.
 */
function move(by: -1 | 1): void {
  const n = items.value.length
  if (n) index.value = (index.value + by + n) % n
}

/**
 * Keyboard handling for the query field: ↑↓ select, ↵ runs, ⌘↵ creates a note from the query, Esc closes.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.isComposing) return
  const q = query.value.trim()
  if (e.key === 'ArrowDown') move(1)
  else if (e.key === 'ArrowUp') move(-1)
  else if (e.key === 'Enter' && e.metaKey) {
    emit('close')
    emit('action', q ? NEW_NOTE_WITH_TEXT : 'newNote', q || undefined)
  } else if (e.key === 'Enter') void run(selected.value)
  else if (e.key === 'Escape') emit('close')
  else if (e.key !== 'Tab') return
  e.preventDefault()
  e.stopPropagation()
}

onMounted(() => {
  returnFocus = document.activeElement as HTMLElement | null
  input.value?.focus()
})
onBeforeUnmount(() => returnFocus?.focus?.())
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-start justify-center bg-scrim px-4 pt-[110px]" @mousedown.self="emit('close')">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and commands"
      class="flex w-[620px] max-w-full flex-col overflow-hidden rounded-xl bg-popover font-sans leading-[normal] shadow-dialog inset-ring inset-ring-border-strong"
    >
      <div class="flex h-14 shrink-0 items-center gap-3 border-b border-border px-[18px]">
        <Search :size="18" class="shrink-0 text-secondary" aria-hidden="true" />
        <input
          ref="input"
          v-model="query"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-autocomplete="list"
          aria-label="Search notes and commands"
          :aria-activedescendant="selected ? optionId(selected) : undefined"
          placeholder="Search notes"
          spellcheck="false"
          class="min-w-0 flex-1 bg-transparent text-[17px] text-primary caret-accent outline-none select-text placeholder:text-tertiary"
          @keydown="onKey"
        />
        <Kbd>esc</Kbd>
      </div>
      <div id="palette-list" ref="list" role="listbox" class="flex max-h-[calc(100vh-240px)] flex-col gap-0.5 overflow-y-auto p-2">
        <div v-for="section in sections" :key="section.id" role="group" :aria-labelledby="`palette-${section.id}`" class="flex flex-col gap-0.5">
          <SectionLabel :id="`palette-${section.id}`" class="px-2.5 pt-2 pb-1">
            {{ section.label }}
            <template v-if="section.trailing" #trailing>{{ section.trailing }}</template>
          </SectionLabel>
          <div
            v-for="item in section.items"
            :id="optionId(item)"
            :key="item.key"
            role="option"
            :aria-selected="item === selected"
            @mousemove="index = items.indexOf(item)"
            @click="run(item)"
          >
            <CommandItem
              v-if="item.kind === 'action'"
              :icon="ICONS[item.action.id] ?? SquarePen"
              :label="item.action.label"
              :combo="comboFor(item.action.id)"
              :selected="item === selected"
            />
            <SearchResult
              v-else
              :title="item.note.title"
              :snippet="item.snippet"
              :meta="item.meta"
              :archived="item.kind === 'archived'"
              :selected="item === selected"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
