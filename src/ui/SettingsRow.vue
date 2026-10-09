<script setup lang="ts">
defineProps<{
  /** Row label, e.g. "Launch at login". */
  title: string
  /** Muted explanation under the title; the `description` slot overrides it. */
  description?: string
}>()
</script>

<template>
  <div class="flex items-center gap-6 border-t border-border py-3 font-sans leading-[normal]">
    <div class="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span class="text-[13px] font-medium text-primary">{{ title }}</span>
      <span v-if="description || $slots.description" class="text-[12px] leading-[1.45] text-tertiary">
        <slot name="description">{{ description }}</slot>
      </span>
    </div>
    <div v-if="$slots.default" class="flex shrink-0 items-center gap-1.5">
      <slot />
    </div>
  </div>
</template>
