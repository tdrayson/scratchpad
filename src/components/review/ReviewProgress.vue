<script setup lang="ts">
import { computed } from 'vue'
import { progressDisplay } from '@/lib/review/session'

const props = defineProps<{
  /** Notes in the session. */
  total: number
  /** Notes dealt with so far. */
  done: number
}>()

const display = computed(() => progressDisplay(props.total, props.done))
</script>

<template>
  <div
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="total"
    :aria-valuenow="done"
    aria-label="Review progress"
    class="flex items-center gap-1"
  >
    <template v-if="display.kind === 'segments'">
      <span
        v-for="(isDone, i) in display.done"
        :key="i"
        class="h-[3px] w-7 rounded-[2px] transition-colors duration-200"
        :class="isDone ? 'bg-secondary' : 'bg-border-strong'"
      />
    </template>
    <span v-else class="h-[3px] w-40 overflow-hidden rounded-[2px] bg-border-strong">
      <span
        class="block h-full rounded-[2px] bg-secondary transition-[width] duration-200"
        :style="{ width: `${display.fraction * 100}%` }"
      />
    </span>
  </div>
</template>
