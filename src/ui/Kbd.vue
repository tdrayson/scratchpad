<script setup lang="ts">
import { computed } from 'vue'
import { formatCombo, glyphs } from '../shared/shortcuts'

const props = defineProps<{
  /** Combo to show, e.g. 'cmd+k'. Omit to use the default slot as the keycap text. */
  combo?: string
  /** One keycap per glyph (as in the shortcut recorder) instead of a single cap. */
  split?: boolean
  /** Text colour: tertiary by default, secondary for 'strong', muted-on-primary for 'inverse'. */
  tone?: 'default' | 'strong' | 'inverse'
}>()

const caps = computed(() => {
  if (!props.combo) return null
  return props.split ? glyphs(props.combo) : [formatCombo(props.combo)]
})

const capClass = computed(() => [
  'inline-flex items-center justify-center rounded-[4px] px-[5px] py-[2px] font-sans text-[11px] leading-[normal] font-medium whitespace-nowrap inset-ring',
  props.tone === 'inverse' ? 'inset-ring-on-primary-line text-on-primary-muted' : 'inset-ring-border-strong',
  props.tone === 'strong' ? 'text-secondary' : props.tone !== 'inverse' && 'text-tertiary',
])
</script>

<template>
  <span v-if="caps && caps.length > 1" class="inline-flex items-center gap-1">
    <kbd v-for="(cap, i) in caps" :key="i" :class="capClass">{{ cap }}</kbd>
  </span>
  <kbd v-else :class="capClass">
    <template v-if="caps">{{ caps[0] }}</template>
    <slot v-else />
  </kbd>
</template>
