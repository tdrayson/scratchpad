<script setup lang="ts">
const isDev = import.meta.env.DEV
</script>

<template>
  <div
    v-if="isDev"
    class="flex h-6 shrink-0 items-center justify-center border-t border-stale/30 bg-stale/15 font-sans text-[11px] font-semibold tracking-wide text-stale"
  >
    DEV BUILD
  </div>
</template>
