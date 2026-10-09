<script setup lang="ts">
import { Archive, Hourglass, PanelLeft, SquarePen } from '@lucide/vue'
import { computed } from 'vue'
import { useClock } from '@/composables/useClock'
import { useNotes } from '@/composables/useNotes'
import { useView } from '@/composables/useView'
import IconButton from '@/components/ui/IconButton.vue'
import SearchField from '@/components/ui/SearchField.vue'
import NavItem from '@/components/sidebar/NavItem.vue'
import NoteList from '@/components/sidebar/NoteList.vue'
import { sidebarSections } from '@/lib/sidebar/sections'

defineProps<{
  /** Peek mode: floats over the editor as a rounded, shadowed panel. */
  floating?: boolean
}>()

const emit = defineEmits<{
  /** Search field activated. */
  search: []
  /** New note button pressed. */
  create: []
}>()

const { groups, queue, archived, currentId, open } = useNotes()
const { view, sidebarOpen } = useView()
// Stay visible while open so the item doesn't vanish once the last note is handled.
const showReview = computed(() => queue.value.length > 0 || view.value === 'review')
const showArchive = computed(() => archived.value.length > 0 || view.value === 'archive')
const { now } = useClock()

const sections = computed(() => sidebarSections(groups.value))
const selectedId = computed(() => (view.value === 'editor' ? currentId.value : null))
</script>

<template>
  <aside
    aria-label="Sidebar"
    class="flex w-[280px] shrink-0 flex-col bg-sidebar font-sans"
    :class="
      floating
        ? 'h-full overflow-hidden rounded-[10px] shadow-[0_16px_48px_var(--shadow-strong)] inset-ring inset-ring-border-strong'
        : 'border-r border-border'
    "
  >
    <div data-tiny-drag class="flex h-[52px] shrink-0 items-center gap-2 px-4">
      <!-- Native traffic lights are drawn here by the window. -->
      <div class="w-[52px] shrink-0" />
      <div class="flex-1" />
      <IconButton :icon="PanelLeft" :label="floating ? 'Show sidebar' : 'Hide sidebar'" shortcut="toggleSidebar" @click="sidebarOpen = !sidebarOpen" />
      <IconButton :icon="SquarePen" label="New note" shortcut="newNote" @click="emit('create')" />
    </div>
    <div class="shrink-0 px-2 pt-1 pb-3">
      <SearchField @activate="emit('search')" />
    </div>
    <NoteList :sections="sections" :selected-id="selectedId" :now="now" @open="open" />
    <div v-if="showReview || showArchive" class="flex shrink-0 flex-col gap-0.5 border-t border-border p-2">
      <NavItem v-if="showReview" :icon="Hourglass" label="Review" :count="queue.length" :stale="queue.length > 0" :active="view === 'review'" @click="view = 'review'" />
      <NavItem v-if="showArchive" :icon="Archive" label="Archive" :count="archived.length" :active="view === 'archive'" @click="view = 'archive'" />
    </div>
  </aside>
</template>
