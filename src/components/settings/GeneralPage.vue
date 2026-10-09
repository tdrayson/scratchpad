<script setup lang="ts">
import { ref } from 'vue'
import { call } from '@/lib/api'
import type { ThemeMode } from '@/shared/types'
import { RELEASES_URL, updateMessage, type UpdateStatus } from '@/shared/updates'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import SettingsGroup from '@/components/ui/SettingsGroup.vue'
import SettingsRow from '@/components/ui/SettingsRow.vue'
import ShortcutRecorder from '@/components/ui/ShortcutRecorder.vue'
import Toggle from '@/components/ui/Toggle.vue'
import type { Option } from '@/lib/ui/types'
import SunsetSchedule from './SunsetSchedule.vue'
import { useSetting, useShortcutEditor } from '@/lib/settings/useSettingsEditor'

const THEMES: Option<ThemeMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'sunset', label: 'Sunset' },
]

const TEXT_SIZES: Option<number>[] = Array.from({ length: 8 }, (_, i) => ({ value: 13 + i, label: `${13 + i} px` }))

const theme = useSetting('theme')
const textSize = useSetting('textSize')
const launchAtLogin = useSetting('launchAtLogin')
const markdownShortcuts = useSetting('markdownShortcuts')
const spellCheck = useSetting('spellCheck')
const checkUpdates = useSetting('checkUpdates')
const { comboFor, setCombo } = useShortcutEditor()

const update = ref<UpdateStatus | null>(null)
const updateStatus = ref('')
const checking = ref(false)

/** Asks GitHub for the latest release and shows the result. */
async function checkNow(): Promise<void> {
  checking.value = true
  updateStatus.value = 'Checking…'
  try {
    update.value = await call('checkForUpdate')
    updateStatus.value = updateMessage(update.value)
  } catch {
    update.value = null
    updateStatus.value = "Couldn't reach GitHub. Check your connection and try again."
  } finally {
    checking.value = false
  }
}

/** Opens the latest release on GitHub. */
function openReleases(): void {
  tiny.app.shell.open(RELEASES_URL).catch(() => {})
}
</script>

<template>
  <div class="flex flex-col gap-7">
    <SettingsGroup label="Appearance">
      <SettingsRow title="Theme" description="Follow macOS, pin one, or go light by day and dark after sunset.">
        <Select v-model="theme" :options="THEMES" label="Theme" />
      </SettingsRow>
      <SunsetSchedule v-if="theme === 'sunset'" />
      <SettingsRow title="Editor text size">
        <Select v-model="textSize" :options="TEXT_SIZES" label="Editor text size" />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup label="Quick capture">
      <SettingsRow
        title="New note from anywhere"
        description="Global shortcut — opens Scratchpad with a blank note, even when it's hidden."
      >
        <ShortcutRecorder
          id="quickCapture"
          :model-value="comboFor('quickCapture')"
          label="New note from anywhere"
          clearable
          @update:model-value="setCombo('quickCapture', $event)"
        />
      </SettingsRow>
      <SettingsRow title="Launch at login">
        <Toggle v-model="launchAtLogin" label="Launch at login" />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup label="Editor">
      <SettingsRow title="Markdown shortcuts" description="Type # , - , [] or ``` to create blocks as you write.">
        <Toggle v-model="markdownShortcuts" label="Markdown shortcuts" />
      </SettingsRow>
      <SettingsRow title="Spell check">
        <Toggle v-model="spellCheck" label="Spell check" />
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup label="Updates">
      <SettingsRow
        title="Check for updates automatically"
        description="Once a day, asks GitHub for the latest version and lets you know. Nothing else is sent."
      >
        <Toggle v-model="checkUpdates" label="Check for updates automatically" />
      </SettingsRow>
      <SettingsRow
        title="Check now"
        description="Updates aren't installed for you; download the new version from GitHub."
      >
        <Button v-if="update?.available" variant="strong" @click="openReleases">Download…</Button>
        <Button v-else variant="strong" :disabled="checking" @click="checkNow">Check now</Button>
      </SettingsRow>
      <p v-if="updateStatus" role="status" class="pt-2 text-[12px] text-tertiary">{{ updateStatus }}</p>
    </SettingsGroup>
  </div>
</template>
