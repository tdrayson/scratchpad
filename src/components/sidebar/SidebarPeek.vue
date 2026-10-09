<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Sidebar from '@/components/sidebar/Sidebar.vue'

const emit = defineEmits<{
  /** Search field activated. */
  search: []
  /** New note button pressed. */
  create: []
}>()

const PEEK_DELAY = 150

const shown = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

/** Shows the floating sidebar once the pointer has rested on the edge strip. */
function arm(): void {
  clearTimeout(timer)
  timer = setTimeout(() => (shown.value = true), PEEK_DELAY)
}

/** Hides the floating sidebar and cancels a pending peek. */
function hide(): void {
  clearTimeout(timer)
  shown.value = false
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="fixed inset-y-0 left-0 z-30" @mouseleave="hide" @keydown.esc="hide">
    <div class="h-full w-1.5" aria-hidden="true" @mouseenter="arm" />
    <!-- The 8px inset counts as inside, so moving from the strip onto the panel doesn't close it. -->
    <div v-if="shown" class="absolute inset-y-0 left-0 p-2">
      <Sidebar floating @search="(hide(), emit('search'))" @create="(hide(), emit('create'))" />
    </div>
  </div>
</template>
