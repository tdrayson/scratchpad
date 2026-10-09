<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { SHORTCUTS, type ShortcutGroup } from '@/shared/shortcuts'
import IconButton from '@/components/ui/IconButton.vue'
import SettingsGroup from '@/components/ui/SettingsGroup.vue'
import SettingsRow from '@/components/ui/SettingsRow.vue'
import ShortcutRecorder from '@/components/ui/ShortcutRecorder.vue'
import { useShortcutEditor } from '@/lib/settings/useSettingsEditor'

interface Row {
  /** Row label. */
  label: string
  /** Shortcut ids edited on this row, one recorder each. */
  ids: string[]
}

const GROUPS: { id: ShortcutGroup; label: string }[] = [
  { id: 'anywhere', label: 'Anywhere' },
  { id: 'notes', label: 'Notes' },
  { id: 'navigation', label: 'Navigation' },
]

/**
 * The rows of a group, with Previous and Next note sharing one.
 * @param group - The group.
 * @return Rows in registry order.
 */
function rowsOf(group: ShortcutGroup): Row[] {
  return SHORTCUTS.filter((s) => s.group === group && s.id !== 'nextNote').map((s) =>
    s.id === 'prevNote' ? { label: 'Previous / next note', ids: ['prevNote', 'nextNote'] } : { label: s.label, ids: [s.id] },
  )
}

/**
 * Accessible name for one recorder on a row.
 * @param id - Shortcut id.
 * @return The shortcut's own label.
 */
function labelOf(id: string): string {
  return SHORTCUTS.find((s) => s.id === id)?.label ?? id
}

const { comboFor, setCombo, isChanged, reset } = useShortcutEditor()
</script>

<template>
  <div class="flex flex-col gap-7">
    <p class="m-0 font-sans text-[12px] leading-[normal] text-tertiary">
      Click a shortcut, then press the new keys. Backspace clears it.
    </p>
    <SettingsGroup v-for="g in GROUPS" :key="g.id" :label="g.label" class="gap-0.5!">
      <SettingsRow v-for="row in rowsOf(g.id)" :key="row.label" :title="row.label" class="py-[9px]!">
        <IconButton
          v-if="isChanged(...row.ids)"
          :icon="RotateCcw"
          label="Reset to default"
          :icon-size="13"
          muted
          @click="reset(...row.ids)"
        />
        <ShortcutRecorder
          v-for="id in row.ids"
          :id="id"
          :key="id"
          :model-value="comboFor(id)"
          :label="labelOf(id)"
          @update:model-value="setCombo(id, $event)"
        />
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
