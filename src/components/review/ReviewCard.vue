<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ageDays } from '@/shared/lifecycle'
import type { Note, NoteSummary } from '@/shared/types'
import AgeBadge from '@/components/ui/AgeBadge.vue'
import { parseDoc } from '@/lib/review/doc'
import { noteMeta } from '@/lib/review/format'
import NoteDoc from './NoteDoc.vue'

const props = defineProps<{
  /** The note being reviewed. */
  note: NoteSummary
  /** The full note once loaded, for the body. */
  full: Note | null
  /** Current time in epoch ms. */
  now: number
}>()

const body = ref<HTMLElement | null>(null)
const overflowing = ref(false)

const doc = computed(() => (props.full ? parseDoc(props.full.doc, props.full.markdown) : null))

watch(
  doc,
  async () => {
    await nextTick()
    overflowing.value = !!body.value && body.value.scrollHeight > body.value.clientHeight + 1
  },
  { immediate: true },
)
</script>

<template>
  <article class="w-full rounded-xl bg-sidebar font-sans leading-[normal] inset-ring inset-ring-border-strong">
    <header class="flex items-center gap-3 border-b border-border px-[22px] py-[18px]">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <h2 class="m-0 truncate text-[17px] font-semibold text-primary">{{ note.title || 'Untitled' }}</h2>
        <p class="m-0 truncate text-[12px] text-tertiary">{{ noteMeta(note, now) }}</p>
      </div>
      <AgeBadge :days="ageDays(note, now)" />
    </header>
    <div
      ref="body"
      class="max-h-[240px] overflow-hidden px-[22px] pt-[18px] pb-[22px]"
      :class="overflowing && 'mask-b-from-70%'"
    >
      <NoteDoc v-if="doc" :doc="doc" />
      <p v-else class="m-0 text-[14px] text-tertiary">{{ note.preview }}</p>
    </div>
  </article>
</template>
