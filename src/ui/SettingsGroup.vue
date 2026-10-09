<script setup lang="ts">
import SectionLabel from './SectionLabel.vue'

defineProps<{
  /** Section label above the rows, e.g. "Appearance". */
  label?: string
}>()
</script>

<template>
  <section class="flex flex-col gap-1">
    <SectionLabel v-if="label">
      {{ label }}
      <template v-if="$slots.trailing" #trailing><slot name="trailing" /></template>
    </SectionLabel>
    <div class="flex flex-col [&>*:first-child]:border-t-0">
      <slot />
    </div>
  </section>
</template>
