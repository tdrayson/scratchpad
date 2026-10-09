<script setup lang="ts">
import { PanelLeft } from '@lucide/vue'
import { useView } from '@/composables/useView'
import IconButton from '@/components/ui/IconButton.vue'

const { sidebarOpen } = useView()
</script>

<template>
  <!-- Pane toolbars pad 24px; collapsed, the design starts the traffic lights at 16px. -->
  <div v-if="!sidebarOpen" class="-ml-2 flex shrink-0 items-center gap-2.5">
    <div class="w-16 shrink-0" />
    <IconButton :icon="PanelLeft" label="Show sidebar" shortcut="toggleSidebar" @click="sidebarOpen = true" />
  </div>
</template>
