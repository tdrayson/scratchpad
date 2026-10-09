<script setup lang="ts">
import { Archive, ArrowUpRight, Copy, PanelLeft, SquarePen, Timer, Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import AgeBadge from './AgeBadge.vue'
import Button from './Button.vue'
import IconButton from './IconButton.vue'
import Kbd from './Kbd.vue'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import MenuSeparator from './MenuSeparator.vue'
import PageHeader from './PageHeader.vue'
import PaneToolbar from './PaneToolbar.vue'
import SearchField from './SearchField.vue'
import SectionLabel from './SectionLabel.vue'
import SegmentedControl from './SegmentedControl.vue'
import Select from './Select.vue'
import SettingsGroup from './SettingsGroup.vue'
import SettingsRow from './SettingsRow.vue'
import ShortcutHint from './ShortcutHint.vue'
import ShortcutRecorder from './ShortcutRecorder.vue'
import SplitButton from './SplitButton.vue'
import StatusBar from './StatusBar.vue'
import Toast from './Toast.vue'
import Toggle from './Toggle.vue'
import Tooltip from './Tooltip.vue'

const theme = ref<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark')
const themes = [
  { value: 'dark' as const, label: 'Dark' },
  { value: 'light' as const, label: 'Light' },
]
const appearance = ref('system')
const appearances = ['System', 'Light', 'Dark', 'Sunset'].map((l) => ({ value: l.toLowerCase(), label: l }))
const launch = ref(true)
const off = ref(false)
const days = ref(7)
const offset = ref(-120)
const offsets = [
  { value: -180, label: '3 h before', detail: '15:41' },
  { value: -120, label: '2 h before', detail: '16:41' },
  { value: -60, label: '1 h before', detail: '17:41' },
  { value: 0, label: 'On time', detail: '18:41' },
  { value: 60, label: '1 h after', detail: '19:41' },
]
const combo = ref('cmd+shift+k')
const query = ref('')
const keepOpen = ref(false)
const split = ref<InstanceType<typeof SplitButton> | null>(null)
const toast = ref(false)

/**
 * Applies the chosen theme to the document.
 * @param t - Theme name.
 */
function setTheme(t: 'dark' | 'light'): void {
  theme.value = t
  document.documentElement.dataset.theme = t
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-10 overflow-auto bg-bg p-10 text-primary">
    <div class="flex items-center gap-4">
      <h1 class="m-0 text-[17px] font-semibold">UI primitives</h1>
      <SegmentedControl :model-value="theme" :options="themes" label="Theme" @update:model-value="setTheme($event!)" />
    </div>

    <section class="flex flex-col gap-4">
      <SectionLabel>Primitives</SectionLabel>
      <div class="flex flex-wrap items-center gap-6">
        <Kbd combo="cmd+k" />
        <Kbd combo="cmd+shift+c" split />
        <Kbd>esc</Kbd>
        <IconButton :icon="PanelLeft" label="Show / hide sidebar" shortcut="toggleSidebar" />
        <IconButton :icon="PanelLeft" label="Sidebar (active)" active />
        <IconButton :icon="SquarePen" label="New note" shortcut="newNote" />
        <IconButton :icon="Trash2" label="Delete permanently" :icon-size="14" muted />
        <Button :icon="Archive">Archive</Button>
        <Button :icon="Copy">Copy Markdown</Button>
        <Button variant="strong">Restore</Button>
        <Button variant="primary" size="lg" :icon="Archive" kbd="e">Archive</Button>
        <Button variant="strong" size="lg" :icon="ArrowUpRight" kbd="enter">Open</Button>
        <Button variant="filled">Undo</Button>
        <Button disabled :icon="Archive">Disabled</Button>
      </div>
      <div class="flex flex-wrap items-center gap-6">
        <SectionLabel class="w-60 px-2.5 pt-1 pb-1.5" tone="stale">
          Going stale
          <template #trailing>2 to review</template>
        </SectionLabel>
        <SectionLabel class="w-60 px-2.5 pt-2 pb-1">
          Notes
          <template #trailing>3 matches</template>
        </SectionLabel>
        <ShortcutHint combo="cmd+k">Search</ShortcutHint>
        <ShortcutHint combo="/">Blocks</ShortcutHint>
        <AgeBadge :days="16" />
        <AgeBadge :days="1" />
        <Tooltip text="Archive" combo="cmd+e"><Button>Hover me</Button></Tooltip>
        <Tooltip text="Above" placement="top"><Button>Top</Button></Tooltip>
        <Tooltip text="To the right" placement="right"><Button>Right</Button></Tooltip>
        <SplitButton ref="split" :icon="Timer" kbd="k" :expanded="keepOpen" @menu="keepOpen = !keepOpen">Keep 7 days</SplitButton>
        <Menu :open="keepOpen" :anchor="split?.more ?? null" class="w-[260px]" label="Keep for" @close="keepOpen = false">
          <SectionLabel class="px-2.5 pt-1.5 pb-1">Keep for</SectionLabel>
          <MenuItem selectable :checked="days === 1" detail="Sat 10 Oct" @select="days = 1">1 day</MenuItem>
          <MenuItem selectable :checked="days === 3" detail="Mon 12 Oct" @select="days = 3">3 days</MenuItem>
          <MenuItem selectable :checked="days === 7" detail="Default · Fri 16 Oct" @select="days = 7">7 days</MenuItem>
          <MenuItem selectable :checked="days === 14" detail="Fri 23 Oct" @select="days = 14">2 weeks</MenuItem>
          <MenuSeparator />
          <MenuItem selectable detail="days or date">Custom…</MenuItem>
          <MenuItem disabled>Disabled item</MenuItem>
        </Menu>
        <Button @click="toast = true">Show toast</Button>
      </div>
      <PageHeader
        class="w-[420px]"
        title="These have been hanging around."
        description="Scratchpad notes surface here after 7 days. Archive what's done — it stays recoverable for 30 days."
      />
    </section>

    <section class="flex flex-col gap-4">
      <SectionLabel>Controls</SectionLabel>
      <div class="flex flex-wrap items-center gap-6">
        <Toggle v-model="launch" label="On" />
        <Toggle v-model="off" label="Off" />
        <Toggle :model-value="true" disabled label="Disabled" />
        <Select v-model="offset" :options="offsets" label="Offset">
          <template #footer>
            <MenuItem selectable detail="15 min steps">Custom offset…</MenuItem>
          </template>
        </Select>
        <Select v-model="days" :options="[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }]" label="Stale after" />
        <div class="w-[264px]"><SearchField /></div>
        <div class="w-[264px]"><SearchField v-model="query" mode="input" placeholder="Search archive" /></div>
        <ShortcutRecorder id="search" v-model="combo" label="Search" />
        <SegmentedControl v-model="appearance" :options="appearances" label="Appearance" />
      </div>
      <SettingsGroup class="w-[480px]" label="Appearance">
        <SettingsRow title="Launch at login" description="Open Scratchpad when you log in.">
          <Toggle v-model="launch" label="Launch at login" />
        </SettingsRow>
        <SettingsRow title="Theme" description="Follow macOS, pin one, or go light by day and dark after sunset.">
          <SegmentedControl v-model="appearance" :options="appearances" label="Theme" />
        </SettingsRow>
        <SettingsRow title="Dark from" description="18:41 today, at sunset.">
          <Select v-model="offset" :options="offsets" label="Dark offset" />
        </SettingsRow>
      </SettingsGroup>
    </section>

    <section class="flex flex-col gap-4">
      <SectionLabel>Chrome</SectionLabel>
      <div class="w-[920px] rounded-lg inset-ring inset-ring-border">
        <PaneToolbar>
          <template #left>Archive · 14 notes</template>
          <template #right>
            <Button :icon="Copy">Copy Markdown</Button>
            <Button :icon="Archive">Archive</Button>
          </template>
        </PaneToolbar>
        <div class="h-24" />
        <StatusBar>
          <template #left>Created today · 142 words</template>
          <template #right><ShortcutHint combo="cmd+k">Search</ShortcutHint></template>
        </StatusBar>
      </div>
    </section>

    <Toast
      v-if="toast"
      :icon="Archive"
      message="Archived “Travelyst integration”"
      detail="142 words"
      action-label="Undo"
      @action="toast = false"
      @dismiss="toast = false"
    />
  </div>
</template>
