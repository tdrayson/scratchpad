<template>
  <div data-tiny-drag class="flex h-[52px] shrink-0 items-center gap-3 pr-4 pl-6 font-sans leading-[normal]">
    <div class="flex min-w-0 flex-1 items-center gap-2 truncate text-[12px] text-tertiary">
      <slot name="left" />
    </div>
    <div v-if="$slots.right" class="flex shrink-0 items-center gap-2">
      <slot name="right" />
    </div>
  </div>
</template>
