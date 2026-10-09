<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'
import { useView } from '@/composables/useView'
import ArchiveView from '@/components/archive/ArchiveView.vue'
import EditorPane from '@/components/editor/EditorPane.vue'
import CommandPalette from '@/components/palette/CommandPalette.vue'
import ReviewView from '@/components/review/ReviewView.vue'
import { useAppCommands } from '@/lib/shell/useAppCommands'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import SidebarPeek from '@/components/sidebar/SidebarPeek.vue'
import { installMenu } from '@/lib/windows'
import Toast from '@/components/ui/Toast.vue'

const { view, sidebarOpen, paletteOpen, toast } = useView()
const editor = ref<{ focus: () => void; flush?: () => void | Promise<void> } | null>(null)
const { run, createAndFocus } = useAppCommands(editor)

useTheme()

onMounted(async () => {
  await useSettings().load()
  await useNotes().load()
  installMenu()
})

/** Runs the toast's action, e.g. Undo, and dismisses it. */
function runToastAction(): void {
  const action = toast.value?.action
  toast.value = null
  action?.run()
}
</script>

<template>
  <div class="flex h-full bg-bg text-primary">
    <div class="sidebar-shell flex shrink-0 overflow-hidden" :style="{ width: sidebarOpen ? '280px' : '0px' }" :inert="!sidebarOpen">
      <Sidebar @search="paletteOpen = true" @create="createAndFocus()" />
    </div>
    <SidebarPeek v-if="!sidebarOpen" @search="paletteOpen = true" @create="createAndFocus()" />
    <main class="relative flex min-w-0 flex-1 flex-col">
      <Transition name="view" mode="out-in">
        <EditorPane v-if="view === 'editor'" ref="editor" />
        <ReviewView v-else-if="view === 'review'" />
        <ArchiveView v-else />
      </Transition>
    </main>
    <Teleport to="body">
      <Transition name="palette">
        <CommandPalette v-if="paletteOpen" @close="paletteOpen = false" @action="run" />
      </Transition>
      <Transition name="toast">
        <Toast
          v-if="toast"
          :key="toast.id"
          :message="toast.message"
          :action-label="toast.action?.label"
          :style="sidebarOpen ? { left: 'calc(50% + 140px)' } : undefined"
          @action="runToastAction"
          @dismiss="toast = null"
        />
      </Transition>
    </Teleport>
  </div>
</template>
