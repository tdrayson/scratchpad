<script setup lang="ts">
import { FileUp } from '@lucide/vue'
import { ref } from 'vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { call } from '@/lib/api'
import { exportMessage, importMessage } from '@/lib/settings/transfer'
import { useSetting } from '@/lib/settings/useSettingsEditor'
import { NOTE_EXTENSIONS } from '@/shared/transfer'
import Button from '@/components/ui/Button.vue'
import SettingsGroup from '@/components/ui/SettingsGroup.vue'
import SettingsRow from '@/components/ui/SettingsRow.vue'
import Toggle from '@/components/ui/Toggle.vue'

const exportArchived = useSetting('exportArchived')

const exportStatus = ref('')
const importStatus = ref('')
const busy = ref(false)
const over = ref(0)

/** Asks for a folder and saves every note into it as a zip of Markdown files. */
async function exportNotes(): Promise<void> {
  const dir = await tiny.dialog.pickFolder()
  if (!dir) return
  busy.value = true
  try {
    const r = await call('exportNotes', { dir })
    exportStatus.value = exportMessage(r.count, r.path)
  } catch {
    exportStatus.value = 'Export failed.'
  } finally {
    busy.value = false
  }
}

/**
 * Imports notes from zips, folders or Markdown files.
 * @param paths - Absolute paths to import.
 */
async function importPaths(paths: string[]): Promise<void> {
  if (!paths.length || busy.value) return
  busy.value = true
  importStatus.value = 'Importing…'
  try {
    importStatus.value = importMessage(await call('importNotes', { paths }))
  } catch {
    importStatus.value = 'Import failed. Is that a zip of Markdown files?'
  } finally {
    busy.value = false
  }
}

/** Opens a file picker for zips and Markdown files. */
async function pick(): Promise<void> {
  const paths = await tiny.dialog.openFiles({
    types: ['zip', ...NOTE_EXTENSIONS],
  })
  if (paths) await importPaths(paths)
}

useFileDrop((paths) => {
  over.value = 0
  importPaths(paths)
})
</script>

<template>
  <div class="flex flex-col gap-7">
    <SettingsGroup label="Export">
      <SettingsRow title="Include archived notes" description="Archived notes go in an Archive folder inside the zip.">
        <Toggle v-model="exportArchived" label="Include archived notes" />
      </SettingsRow>
      <SettingsRow title="Export all notes" description="Saves a zip with one Markdown file per note.">
        <Button variant="strong" :disabled="busy" @click="exportNotes">Export…</Button>
      </SettingsRow>
      <p v-if="exportStatus" role="status" class="pt-2 text-[12px] text-tertiary">
        {{ exportStatus }}
      </p>
    </SettingsGroup>

    <SettingsGroup label="Import">
      <div class="pt-2">
        <div
          class="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors"
          :class="over ? 'border-border-strong bg-surface-hover' : 'border-border'"
          @dragenter.prevent="over++"
          @dragover.prevent
          @dragleave="over = Math.max(0, over - 1)"
          @drop.prevent="over = 0"
        >
          <FileUp :size="20" class="text-tertiary" aria-hidden="true" />
          <div class="flex flex-col gap-1">
            <span class="text-[13px] font-medium text-primary">Drop a zip, folder or Markdown files</span>
            <span class="text-[12px] leading-[1.45] text-tertiary">
              Each file becomes a note. Anything in an Archive folder goes straight to the archive, and notes you
              already have are skipped.
            </span>
          </div>
          <Button variant="strong" :disabled="busy" @click="pick">Choose files…</Button>
        </div>
      </div>
      <p v-if="importStatus" role="status" class="pt-2 text-[12px] text-tertiary">
        {{ importStatus }}
      </p>
    </SettingsGroup>
  </div>
</template>
