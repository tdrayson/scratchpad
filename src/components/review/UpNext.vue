<script setup lang="ts">
import { ageLabel } from '@/shared/lifecycle'
import type { NoteSummary } from '@/shared/types'
import SectionLabel from '@/components/ui/SectionLabel.vue'

defineProps<{
  /** Notes still to review after the current one. */
  notes: NoteSummary[]
  /** Current time in epoch ms. */
  now: number
}>()
</script>

<template>
  <section class="flex w-full flex-col gap-2 font-sans leading-[normal]" aria-label="Up next">
    <SectionLabel>Up next</SectionLabel>
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="n in notes" :key="n.id" class="flex items-center gap-3 border-t border-border py-3">
        <span class="shrink-0 text-[13px] font-medium whitespace-nowrap text-secondary">{{ n.title || 'Untitled' }}</span>
        <span class="min-w-0 flex-1 truncate text-[12px] text-tertiary">{{ n.preview }}</span>
        <span class="shrink-0 text-[11px] text-stale">{{ ageLabel(n.updatedAt, now) }}</span>
      </li>
    </ul>
  </section>
</template>
