<script setup lang="ts">
import Kbd from './Kbd.vue'

defineProps<{
  /** Combo to show, e.g. 'cmd+k'. */
  combo: string
}>()
</script>

<template>
  <span class="inline-flex items-center gap-1.5 font-sans leading-[normal]">
    <Kbd :combo="combo" />
    <span v-if="$slots.default" class="text-[11px] text-tertiary"><slot /></span>
  </span>
</template>
