<script setup lang="ts">
import type { DocNode } from '@/lib/review/doc'
import { renderDoc } from '@/lib/review/renderDoc'

const props = defineProps<{
  /** The document root. */
  doc: DocNode
}>()

/**
 * Functional child that renders the document's blocks.
 * @return The rendered blocks.
 */
const Blocks = () => renderDoc(props.doc)
</script>

<template>
  <div class="flex flex-col gap-2.5 font-sans text-[14px] leading-[1.5] text-primary">
    <Blocks />
  </div>
</template>
