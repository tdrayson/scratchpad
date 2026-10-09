<script setup lang="ts">
defineProps<{
  /** Stale tone colours the label orange, as on "Going stale". */
  tone?: 'default' | 'stale'
}>()
</script>

<template>
  <div class="flex items-center font-sans leading-[normal]">
    <span
      class="min-w-0 flex-1 truncate text-[10px] font-semibold tracking-[0.8px] uppercase"
      :class="tone === 'stale' ? 'text-stale' : 'text-tertiary'"
    >
      <slot />
    </span>
    <span v-if="$slots.trailing" class="text-[11px] text-tertiary">
      <slot name="trailing" />
    </span>
  </div>
</template>
