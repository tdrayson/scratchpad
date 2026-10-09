<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { call, on } from '@/lib/api'
import { KEEP_PRESETS, keepLabel } from '@/shared/lifecycle'
import Button from '@/components/ui/Button.vue'
import MenuItem from '@/components/ui/MenuItem.vue'
import Select from '@/components/ui/Select.vue'
import SettingsGroup from '@/components/ui/SettingsGroup.vue'
import SettingsRow from '@/components/ui/SettingsRow.vue'
import Toggle from '@/components/ui/Toggle.vue'
import type { Option } from '@/lib/ui/types'
import { dayCount } from '@/lib/review/format'
import LifecycleStage from './LifecycleStage.vue'
import { applyChoice, clockLabel, REMINDER_TIMES, reminderChoice, reminderOptions } from '@/lib/settings/reminder'
import { useSetting } from '@/lib/settings/useSettingsEditor'

/**
 * Select options for a list of day counts.
 * @param days - Day counts.
 * @return Options labelled '7 days' etc.
 */
const dayOptions = (days: number[]): Option<number>[] => days.map((d) => ({ value: d, label: dayCount(d) }))

const STALE_DAYS = dayOptions([3, 5, 7, 10, 14, 30])
const ARCHIVE_DAYS = dayOptions([7, 14, 30, 60, 90])
const KEEP_DAYS: Option<number>[] = KEEP_PRESETS.map((d) => ({ value: d, label: keepLabel(d) }))

const { settings, update } = useSettings()
const staleDays = useSetting('staleDays')
const keepDays = useSetting('keepDays')
const archiveDays = useSetting('archiveDays')
const dockBadge = useSetting('dockBadge')

const reminder = computed({
  get: () => reminderChoice(settings.value.reminder),
  set: (c: string) => void update({ reminder: applyChoice(settings.value.reminder, c) }),
})
const reminderChoices = computed(() => reminderOptions(settings.value.reminder.time))

/**
 * Sets the reminder time, turning the reminder on.
 * @param time - Minutes after midnight.
 */
function setReminderTime(time: number): void {
  void update({ reminder: { ...settings.value.reminder, enabled: true, time } })
}

const archived = ref(0)

/** Recounts archived notes. */
async function count(): Promise<void> {
  archived.value = (await call('listNotes')).filter((n) => n.archivedAt !== null).length
}

const emptyDescription = computed(() => {
  if (!archived.value) return 'The archive is empty.'
  const notes = archived.value === 1 ? 'the 1 archived note' : `all ${archived.value} archived notes`
  return `Permanently delete ${notes}. This can't be undone.`
})

/** Confirms, then deletes every archived note. */
async function emptyArchive(): Promise<void> {
  const ok = await tiny.dialog.confirm(`Delete ${archived.value === 1 ? '1 archived note' : `${archived.value} archived notes`}?`, {
    detail: "This can't be undone.",
    ok: 'Empty archive',
  })
  if (!ok) return
  await call('emptyArchive')
  await count()
}

let off: (() => void) | null = null
onMounted(() => {
  void count()
  off = on('notes-changed', () => void count())
})
onBeforeUnmount(() => off?.())
</script>

<template>
  <div class="flex flex-col gap-7">
    <div class="flex items-center gap-2.5 rounded-lg px-4 py-3.5 inset-ring inset-ring-border">
      <LifecycleStage stage="Active" when="In your list" />
      <ArrowRight :size="13" class="shrink-0 text-tertiary" aria-hidden="true" />
      <LifecycleStage stage="Going stale" :when="`After ${dayCount(staleDays)}`" tone="stale" />
      <ArrowRight :size="13" class="shrink-0 text-tertiary" aria-hidden="true" />
      <LifecycleStage stage="Archived" when="You archive it" />
      <ArrowRight :size="13" class="shrink-0 text-tertiary" aria-hidden="true" />
      <LifecycleStage stage="Deleted" :when="`After ${dayCount(archiveDays)}`" />
    </div>

    <SettingsGroup label="Review">
      <SettingsRow title="Surface notes after" description="Older notes move to Going stale and show up in Review.">
        <Select v-model="staleDays" :options="STALE_DAYS" label="Surface notes after" />
      </SettingsRow>
      <SettingsRow
        title="Default “Keep” length"
        description="Used when you press K. Pick another length from the Keep menu in Review."
      >
        <Select v-model="keepDays" :options="KEEP_DAYS" label="Default Keep length" />
      </SettingsRow>
      <SettingsRow title="Review reminder" description="A notification when notes are waiting.">
        <Select v-model="reminder" :options="reminderChoices" label="Review reminder">
          <template #footer>
            <MenuItem
              v-for="t in REMINDER_TIMES"
              :key="t"
              selectable
              :checked="settings.reminder.enabled && settings.reminder.time === t"
              @select="setReminderTime(t)"
            >
              At {{ clockLabel(t) }}
            </MenuItem>
          </template>
        </Select>
      </SettingsRow>
      <SettingsRow title="Dock badge" description="Show how many notes are waiting for review.">
        <Toggle v-model="dockBadge" label="Dock badge" />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup label="Archive">
      <SettingsRow title="Delete archived notes after" description="Restore anything from the archive until then.">
        <Select v-model="archiveDays" :options="ARCHIVE_DAYS" label="Delete archived notes after" />
      </SettingsRow>
      <SettingsRow title="Empty archive" :description="emptyDescription">
        <Button variant="danger" :disabled="!archived" @click="emptyArchive">Empty archive…</Button>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
