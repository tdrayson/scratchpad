<script setup lang="ts">
defineProps<{
  /** Stage name, e.g. "Going stale". */
  stage: string
  /** When a note reaches it, e.g. "After 7 days". */
  when: string
  /** Stale tone colours the stage name orange. */
  tone?: 'default' | 'stale'
}>()
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col gap-0.5 font-sans leading-[normal] whitespace-nowrap">
    <span class="text-[12px] font-semibold" :class="tone === 'stale' ? 'text-stale' : 'text-primary'">{{ stage }}</span>
    <span class="text-[11px] text-tertiary">{{ when }}</span>
  </div>
</template>
