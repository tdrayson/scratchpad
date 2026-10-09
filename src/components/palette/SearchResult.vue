<script setup lang="ts">
import { Archive, FileText } from '@lucide/vue'
import type { SnippetPart } from '@/lib/palette/palette'

defineProps<{
  /** Note title; "Untitled" when empty. */
  title: string
  /** Snippet runs; matched runs render in the accent colour. */
  snippet: SnippetPart[]
  /** Right-hand detail, e.g. "2d" or "Deletes in 21d". */
  meta: string
  /** Archived notes show the archive icon, an orange meta and the restore hint. */
  archived?: boolean
  /** Highlighted by keyboard or pointer. */
  selected?: boolean
}>()
</script>

<template>
  <div
    class="flex cursor-default items-center gap-3 rounded-[7px] px-2.5 py-2 font-sans leading-[normal]"
    :class="selected && 'bg-popover-selected'"
  >
    <component :is="archived ? Archive : FileText" :size="16" class="shrink-0" :class="selected ? 'text-primary' : 'text-tertiary'" aria-hidden="true" />
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="truncate text-[13px] font-medium text-primary">{{ title || 'Untitled' }}</span>
      <span class="truncate text-[12px] text-tertiary">
        <template v-for="(part, i) in snippet" :key="i">
          <span v-if="part.match" class="font-medium text-accent">{{ part.text }}</span>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
    </div>
    <span v-if="archived && selected" class="shrink-0 text-[11px] text-secondary">Restore &amp; open</span>
    <span class="shrink-0 text-[11px] whitespace-nowrap" :class="archived ? 'text-stale' : 'text-tertiary'">{{ meta }}</span>
  </div>
</template>
