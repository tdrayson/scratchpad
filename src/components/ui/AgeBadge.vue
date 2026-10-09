<script setup lang="ts">
import { Hourglass } from '@lucide/vue'

defineProps<{
  /** Age in whole days. */
  days: number
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-[20px] px-2.5 py-1 font-sans text-[12px] leading-[normal] font-medium whitespace-nowrap text-stale inset-ring inset-ring-stale"
  >
    <Hourglass :size="12" aria-hidden="true" />
    {{ days }} {{ days === 1 ? 'day' : 'days' }}
  </span>
</template>
