<script setup lang="ts">
import { Hourglass, Keyboard, Settings2 } from '@lucide/vue'
import { FOCUS_RING_INSET } from '@/lib/ui/focus'
import type { SettingsPage } from '@/lib/settings/pages'

const page = defineModel<SettingsPage>({ required: true })

const ITEMS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'review', label: 'Review & Archive', icon: Hourglass },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
] as const
</script>

<template>
  <nav
    aria-label="Settings"
    class="flex w-[200px] shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar px-2 pb-2 font-sans leading-[normal]"
  >
    <div data-tiny-drag class="h-[52px] shrink-0" />
    <button
      v-for="item in ITEMS"
      :key="item.id"
      type="button"
      :aria-current="page === item.id ? 'page' : undefined"
      class="flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px]"
      :class="[
        FOCUS_RING_INSET,
        page === item.id ? 'bg-surface font-medium text-primary' : 'text-secondary hover:bg-surface-hover',
      ]"
      @click="page = item.id"
    >
      <component :is="item.icon" :size="15" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
    </button>
  </nav>
</template>
