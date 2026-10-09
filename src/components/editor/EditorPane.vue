<script setup lang="ts">
import { Archive, Copy, Plus } from '@lucide/vue'
import { EditorContent } from '@tiptap/vue-3'
import { computed, nextTick, ref, watch } from 'vue'
import { useClock } from '@/composables/useClock'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useShortcuts } from '@/composables/useShortcuts'
import { useView } from '@/composables/useView'
import Button from '@/components/ui/Button.vue'
import PaneToolbar from '@/components/ui/PaneToolbar.vue'
import ShortcutHint from '@/components/ui/ShortcutHint.vue'
import StatusBar from '@/components/ui/StatusBar.vue'
import Tooltip from '@/components/ui/Tooltip.vue'
import SidebarToggle from '@/components/sidebar/SidebarToggle.vue'
import { writeClipboard } from '@/lib/editor/clipboard'
import { toMarkdown } from '@/lib/editor/extensions'
import { createdLabel, editedLabel, wordCount } from '@/lib/editor/meta'
import { createSlashState } from '@/lib/editor/slash'
import SlashMenu from '@/components/editor/SlashMenu.vue'
import { useNoteEditor } from '@/lib/editor/useNoteEditor'
import '@/styles/editor.css'

const { notes, current, currentId, archive, create } = useNotes()
const { settings, shortcuts } = useSettings()
const { now } = useClock()
const { sidebarOpen, showToast } = useView()

const slash = createSlashState()
const { editor, generation, markdown, editedAt, focus, flush } = useNoteEditor(slash)

const title = computed(() => notes.value.find((n) => n.id === currentId.value)?.title || current.value?.title || 'Untitled')
const edited = computed(() => editedLabel(editedAt.value, Math.max(now.value, editedAt.value)))
const info = computed(() =>
  current.value ? `${createdLabel(current.value.createdAt, now.value)} · ${wordCount(markdown.value)} words` : '',
)

/** Copies the whole note as Markdown and confirms with a toast. */
function copyMarkdown(): void {
  if (!editor.value || !current.value) return
  writeClipboard({ text: toMarkdown(editor.value) })
  showToast('Copied as Markdown')
}

/** Saves pending edits, then archives the open note. */
async function archiveCurrent(): Promise<void> {
  const id = currentId.value
  if (!id) return
  await flush()
  await archive(id)
}

/** Starts a new note and puts the caret in it. */
async function newNote(): Promise<void> {
  await create()
  await nextTick()
  focus()
}

const scroller = ref<HTMLElement | null>(null)
watch(currentId, () => scroller.value?.scrollTo({ top: 0 }))

useShortcuts({ copyMarkdown })

defineExpose({ focus, flush })
</script>

<template>
  <section class="flex h-full min-w-0 flex-1 flex-col bg-bg font-sans" aria-label="Editor">
    <PaneToolbar>
      <template #left>
        <SidebarToggle />
        <span v-if="current" class="truncate">{{ sidebarOpen ? edited : `${title} · ${edited}` }}</span>
      </template>
      <template v-if="current" #right>
        <Tooltip text="Copy Markdown" :combo="shortcuts.copyMarkdown">
          <Button :icon="Copy" @click="copyMarkdown">Copy Markdown</Button>
        </Tooltip>
        <Tooltip text="Archive" :combo="shortcuts.archiveNote">
          <Button :icon="Archive" @click="archiveCurrent">Archive</Button>
        </Tooltip>
      </template>
    </PaneToolbar>

    <div
      v-show="current"
      ref="scroller"
      class="min-h-0 flex-1 overflow-y-auto px-[88px] pt-10"
      :style="{ '--editor-size': `${settings.textSize}px` }"
    >
      <EditorContent v-if="editor" :key="generation" :editor="editor" class="mx-auto max-w-[800px]" />
    </div>

    <div v-if="!current" class="flex flex-1 flex-col items-center justify-center gap-4 pb-10 text-center">
      <div class="flex flex-col gap-1.5">
        <p class="text-[14px] font-medium text-secondary">No note open</p>
        <p class="text-[12px] text-tertiary">Start a new one, or pick one from the sidebar.</p>
      </div>
      <Button :icon="Plus" variant="strong" :kbd="shortcuts.newNote" @click="newNote">New note</Button>
    </div>

    <StatusBar>
      <template #left>{{ info }}</template>
      <template #right>
        <ShortcutHint :combo="shortcuts.search">Search</ShortcutHint>
      </template>
    </StatusBar>

    <SlashMenu :state="slash" :text-size="settings.textSize" />
  </section>
</template>
