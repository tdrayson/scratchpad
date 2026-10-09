<script setup lang="ts">
import { Archive, ArrowUpRight } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useClock } from '@/composables/useClock'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useView } from '@/composables/useView'
import { call } from '@/lib/api'
import { keepUntil } from '@/shared/lifecycle'
import type { Note } from '@/shared/types'
import Button from '@/components/ui/Button.vue'
import Kbd from '@/components/ui/Kbd.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PaneToolbar from '@/components/ui/PaneToolbar.vue'
import SidebarToggle from '@/components/sidebar/SidebarToggle.vue'
import { FOCUS_RING } from '@/lib/ui/focus'
import { dayCount, shortDate } from '@/lib/review/format'
import KeepControl from './KeepControl.vue'
import ReviewCard from './ReviewCard.vue'
import ReviewProgress from './ReviewProgress.vue'
import { reviewAction, reviewState, type ReviewAction } from '@/lib/review/session'
import UpNext from './UpNext.vue'

const notes = useNotes()
const { settings } = useSettings()
const { now } = useClock()
const { view, paletteOpen, showToast } = useView()

const seen = ref<string[]>([])
const full = ref<Record<string, Note | null>>({})
const keepControl = ref<InstanceType<typeof KeepControl> | null>(null)
const busy = ref(false)

const state = computed(() => reviewState(notes.queue.value, seen.value))
const current = computed(() => state.value.current)
const description = computed(
  () =>
    `Scratchpad notes surface here after ${dayCount(settings.value.staleDays)}. Archive what's done — it stays recoverable for ${dayCount(settings.value.archiveDays)}.`,
)

/**
 * Loads a note's full content for the card, once.
 * @param id - Note id.
 */
async function fetchNote(id: string): Promise<void> {
  if (id in full.value) return
  full.value = { ...full.value, [id]: null }
  try {
    full.value = { ...full.value, [id]: (await call('getNote', { id })) ?? null }
  } catch {
    // The card falls back to the preview line.
  }
}

watch(
  () => [current.value?.id, state.value.upNext[0]?.id],
  (ids) => ids.forEach((id) => id && fetchNote(id)),
  { immediate: true },
)

/**
 * Marks a note dealt with, runs the action, and puts the note back if that fails.
 * @param id - The note.
 * @param run - The backend action.
 * @param failure - Toast text if it fails.
 */
async function settle(id: string, run: () => Promise<void>, failure: string): Promise<void> {
  busy.value = true
  seen.value = [...seen.value, id]
  try {
    await run()
  } catch {
    seen.value = seen.value.filter((s) => s !== id)
    showToast(failure)
  } finally {
    busy.value = false
  }
}

/**
 * Keeps the current note out of Review until a date.
 * @param until - Return instant in epoch ms.
 */
function keep(until: number): void {
  const note = current.value
  if (!note || busy.value) return
  settle(
    note.id,
    async () => {
      await notes.keep(note.id, until)
      showToast(`Kept until ${shortDate(until)}`)
    },
    'Couldn’t keep that note',
  )
}

/**
 * Archives a note without leaving Review, even if it was open in the editor.
 * @param id - Note id.
 */
async function archive(id: string): Promise<void> {
  await notes.archive(id)
  view.value = 'review'
}

/**
 * Runs a Review action on the current note.
 * @param action - What to do.
 */
function act(action: ReviewAction): void {
  const note = current.value
  if (!note || busy.value) return
  if (action === 'archive') settle(note.id, () => archive(note.id), 'Couldn’t archive that note')
  else if (action === 'keep') keep(keepUntil(Date.now(), settings.value.keepDays))
  else if (action === 'open') notes.open(note.id)
  else seen.value = [...seen.value, note.id]
}

/**
 * Handles Review keys when nothing else owns the key press.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (paletteOpen.value || keepControl.value?.busy) return
  const action = reviewAction(e)
  if (!action || !current.value) return
  e.preventDefault()
  act(action)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="flex h-full min-w-0 flex-1 flex-col bg-bg font-sans leading-[normal]" aria-label="Review">
    <PaneToolbar>
      <template #left>
        <SidebarToggle />
        <span v-if="current">Review · {{ state.position }} of {{ state.total }}</span>
        <span v-else>Review</span>
      </template>
      <template v-if="current" #right>
        <ReviewProgress :total="state.total" :done="state.position - 1" />
      </template>
    </PaneToolbar>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="current" class="mx-auto flex w-full max-w-[920px] flex-col gap-7 px-[88px] pt-11 pb-12">
        <PageHeader title="These have been hanging around." :description="description" />

        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-1 opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="-translate-y-1 opacity-0"
        >
          <ReviewCard :key="current.id" :note="current" :full="full[current.id] ?? null" :now="now" />
        </Transition>

        <div class="flex w-full items-center gap-2.5">
          <Button variant="primary" size="lg" :icon="Archive" kbd="e" @click="act('archive')">Archive</Button>
          <KeepControl ref="keepControl" :now="now" :keep-days="settings.keepDays" @keep="keep" />
          <Button variant="strong" size="lg" :icon="ArrowUpRight" kbd="enter" @click="act('open')">Open</Button>
          <button
            type="button"
            class="ml-auto flex items-center gap-2 rounded-md text-[13px] text-tertiary hover:text-secondary"
            :class="FOCUS_RING"
            @click="act('skip')"
          >
            Skip
            <Kbd combo="right" aria-hidden="true" />
          </button>
        </div>

        <UpNext v-if="state.upNext.length" :notes="state.upNext" :now="now" />
      </div>

      <div v-else class="mx-auto flex w-full max-w-[920px] flex-col items-start gap-6 px-[88px] pt-11 pb-12">
        <PageHeader title="All caught up.">
          <template #description>
            <template v-if="state.skipped">
              You skipped {{ state.skipped === 1 ? 'one note' : `${state.skipped} notes` }}. They’ll be here when you’re ready.
            </template>
            <template v-else>Nothing has been hanging around for more than {{ dayCount(settings.staleDays) }}.</template>
          </template>
        </PageHeader>
        <div class="flex items-center gap-2.5">
          <Button v-if="state.skipped" variant="strong" size="lg" @click="seen = []">Go through skipped</Button>
          <Button :variant="state.skipped ? 'default' : 'strong'" size="lg" @click="view = 'editor'">Back to notes</Button>
        </div>
      </div>
    </div>
  </section>
</template>
