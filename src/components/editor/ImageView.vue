<script setup lang="ts">
import { ImageOff } from '@lucide/vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { ref, watchEffect } from 'vue'
import { imageUrl } from '@/lib/editor/imageUrls'

const props = defineProps(nodeViewProps)

const url = ref<string | null>(null)
const missing = ref(false)

watchEffect(async () => {
  const id = props.node.attrs.id as string | null
  url.value = null
  missing.value = false
  if (!id) return void (missing.value = true)
  url.value = await imageUrl(id)
  missing.value = !url.value
})
</script>

<template>
  <NodeViewWrapper as="span" class="sp-image" :class="{ 'is-selected': selected }" data-drag-handle>
    <img v-if="url" :src="url" :alt="node.attrs.alt" draggable="false" />
    <span v-else-if="missing" class="sp-image-missing">
      <ImageOff :size="14" aria-hidden="true" />
      {{ node.attrs.src ? `Image not loaded: ${node.attrs.src}` : 'Image unavailable' }}
    </span>
  </NodeViewWrapper>
</template>
