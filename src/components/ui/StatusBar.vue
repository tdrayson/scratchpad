<template>
  <footer class="flex h-9 shrink-0 items-center gap-4 border-t border-border px-6 font-sans text-[11px] leading-[normal] text-tertiary">
    <div class="min-w-0 flex-1 truncate">
      <slot name="left" />
    </div>
    <div v-if="$slots.right" class="flex shrink-0 items-center gap-4">
      <slot name="right" />
    </div>
  </footer>
</template>
