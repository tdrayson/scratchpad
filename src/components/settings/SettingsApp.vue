<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'
import { comboFromEvent } from '@/shared/shortcuts'
import GeneralPage from './GeneralPage.vue'
import { PAGE_TITLES, savedPage, savePage } from '@/lib/settings/pages'
import ReviewArchivePage from './ReviewArchivePage.vue'
import SettingsNav from './SettingsNav.vue'
import ShortcutsPage from './ShortcutsPage.vue'

useTheme()
const { load } = useSettings()

const ready = ref(false)
const page = ref(savedPage())
const scroller = ref<HTMLElement | null>(null)

watch(page, (p) => {
  savePage(p)
  scroller.value?.scrollTo({ top: 0 })
})

/**
 * Esc or ⌘W closes the window, unless something inside already handled the key.
 * @param e - The keydown event.
 */
function onKey(e: KeyboardEvent): void {
  if (e.defaultPrevented) return
  const combo = comboFromEvent(e)
  if (combo !== 'escape' && combo !== 'cmd+w') return
  e.preventDefault()
  void tiny.win.close()
}

onMounted(async () => {
  addEventListener('keydown', onKey)
  await load()
  ready.value = true
})

onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-full overflow-hidden bg-bg font-sans leading-[normal] text-primary">
    <SettingsNav v-model="page" />
    <main class="flex min-w-0 flex-1 flex-col">
      <header data-tiny-drag class="shrink-0 px-8 pt-[22px]">
        <h1 class="m-0 text-[20px] font-semibold tracking-[-0.3px] text-primary">{{ PAGE_TITLES[page] }}</h1>
      </header>
      <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto px-8 pt-7 pb-9">
        <template v-if="ready">
          <GeneralPage v-if="page === 'general'" />
          <ReviewArchivePage v-else-if="page === 'review'" />
          <ShortcutsPage v-else />
        </template>
      </div>
    </main>
  </div>
</template>
