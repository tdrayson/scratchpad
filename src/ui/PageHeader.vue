<script setup lang="ts">
defineProps<{
  /** Heading text; the `title` slot overrides it. */
  title?: string
  /** Sub-heading text; the `description` slot overrides it. */
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-2 font-sans">
    <h1 class="m-0 text-[26px] leading-[normal] font-semibold tracking-[-0.4px] text-primary">
      <slot name="title">{{ title }}</slot>
    </h1>
    <p v-if="description || $slots.description" class="m-0 text-[14px] leading-[1.5] text-secondary">
      <slot name="description">{{ description }}</slot>
    </p>
  </header>
</template>
