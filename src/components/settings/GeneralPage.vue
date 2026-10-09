<script setup lang="ts">
import type { ThemeMode } from '@/shared/types'
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
const menuBarIcon = useSetting('menuBarIcon')
const launchAtLogin = useSetting('launchAtLogin')
const markdownShortcuts = useSetting('markdownShortcuts')
const spellCheck = useSetting('spellCheck')
const { comboFor, setCombo } = useShortcutEditor()
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
      <SettingsRow title="Show in menu bar">
        <Toggle v-model="menuBarIcon" label="Show in menu bar" />
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
  </div>
</template>
