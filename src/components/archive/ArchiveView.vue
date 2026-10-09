<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useClock } from '@/composables/useClock'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useShortcuts } from '@/composables/useShortcuts'
import { useView } from '@/composables/useView'
import type { NoteSummary } from '@/shared/types'
import Button from '@/components/ui/Button.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PaneToolbar from '@/components/ui/PaneToolbar.vue'
import SidebarToggle from '@/components/sidebar/SidebarToggle.vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import { dayCount } from '@/lib/review/format'
import ArchiveRow from './ArchiveRow.vue'
import { stepIndex } from '@/lib/archive/purge'

const notes = useNotes()
const { settings } = useSettings()
const { now } = useClock()
const { view, showToast } = useView()

const listEl = ref<HTMLElement | null>(null)
const selected = ref(0)
const list = computed(() => notes.archived.value)
const count = computed(() => (list.value.length === 1 ? '1 note' : `${list.value.length} notes`))

watch(
  () => list.value.length,
  (n) => (selected.value = Math.min(selected.value, Math.max(0, n - 1))),
)

/**
 * Moves the keyboard selection and focus.
 * @param index - Row index.
 */
async function select(index: number): Promise<void> {
  if (index < 0) return
  selected.value = index
  await nextTick()
  listEl.value?.querySelectorAll<HTMLElement>(':scope > li')[index]?.focus()
}

/**
 * ↑/↓ move between rows.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
  if (!step || e.metaKey || e.altKey || e.ctrlKey) return
  e.preventDefault()
  select(stepIndex(selected.value, step, list.value.length))
}

/**
 * Restores a note and opens it.
 * @param note - The archived note.
 */
async function restore(note: NoteSummary): Promise<void> {
  try {
    await notes.restore(note.id)
    await notes.open(note.id)
  } catch {
    showToast('Couldn’t restore that note')
  }
}

/**
 * Deletes a note for good, after asking.
 * @param note - The archived note.
 */
async function remove(note: NoteSummary): Promise<void> {
  const ok = await tiny.dialog.confirm(`Delete “${note.title || 'Untitled'}” permanently?`, {
    detail: 'This can’t be undone.',
    ok: 'Delete',
  })
  if (!ok) return
  const back = view.value
  const hadFocus = !!listEl.value?.contains(document.activeElement)
  try {
    await notes.remove(note.id)
    view.value = back
    showToast(`Deleted “${note.title || 'Untitled'}”`)
    if (hadFocus) select(Math.min(selected.value, list.value.length - 1))
  } catch {
    showToast('Couldn’t delete that note')
  }
}

/** Deletes every archived note, after asking. */
async function emptyArchive(): Promise<void> {
  const ok = await tiny.dialog.confirm('Empty the archive?', {
    detail: `${count.value} will be deleted permanently. This can’t be undone.`,
    ok: 'Empty archive',
  })
  if (!ok) return
  try {
    const n = await notes.emptyArchive()
    showToast(n === 1 ? 'Deleted 1 note' : `Deleted ${n} notes`)
  } catch {
    showToast('Couldn’t empty the archive')
  }
}

useShortcuts({
  deleteNote: () => {
    const note = list.value[selected.value]
    if (note && listEl.value?.contains(document.activeElement)) remove(note)
  },
})
</script>

<template>
  <section class="flex h-full min-w-0 flex-1 flex-col bg-bg font-sans leading-[normal]" aria-label="Archive">
    <PaneToolbar>
      <template #left>
        <SidebarToggle />
        <span>Archive · {{ count }}</span>
      </template>
      <template v-if="list.length" #right>
        <button
          type="button"
          class="flex h-7 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap text-stale hover:bg-surface-hover"
          :class="FOCUS_RING"
          @click="emptyArchive"
        >
          <Trash2 :size="14" aria-hidden="true" />
          Empty archive
        </button>
      </template>
    </PaneToolbar>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-16 pt-11 pb-12">
        <PageHeader
          class="px-3"
          :title="list.length ? 'Archive' : 'Nothing archived'"
          :description="
            list.length
              ? `Archived notes are deleted for good after ${dayCount(settings.archiveDays)}. Restore anything you still need.`
              : `Notes you archive wait here for ${dayCount(settings.archiveDays)} before they’re deleted.`
          "
        />

        <div v-if="list.length" class="flex w-full flex-col gap-0.5">
          <div
            class="flex gap-6 border-b border-border px-3 pb-2.5 text-[10px] font-semibold tracking-[0.8px] text-tertiary uppercase"
            aria-hidden="true"
          >
            <span class="flex-1">Note</span>
            <span class="w-24">Archived</span>
            <span class="w-[150px]">Deletes in</span>
            <span class="w-[132px]" />
          </div>
          <ul ref="listEl" class="m-0 flex list-none flex-col gap-0.5 p-0" aria-label="Archived notes" @keydown="onKey">
            <ArchiveRow
              v-for="(note, i) in list"
              :key="note.id"
              :note="note"
              :archive-days="settings.archiveDays"
              :now="now"
              :selected="i === selected"
              @focus="selected = i"
              @restore="restore(note)"
              @remove="remove(note)"
            />
          </ul>
        </div>

        <Button v-else variant="strong" size="lg" class="mx-3 self-start" @click="view = 'editor'">Back to notes</Button>
      </div>
    </div>
  </section>
</template>
