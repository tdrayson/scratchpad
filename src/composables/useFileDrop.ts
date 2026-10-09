import { onBeforeUnmount, onMounted } from 'vue'

let current: ((paths: string[]) => void) | null = null
let registered = false

/**
 * Receives files dropped on the window while the calling component is mounted.
 * @param fn - Called with the dropped files' real paths.
 */
export function useFileDrop(fn: (paths: string[]) => void): void {
  onMounted(() => {
    // tiny.win.onDrop has no way to unsubscribe, so register once and route to whoever is mounted.
    if (!registered) {
      tiny.win.onDrop((paths) => current?.(paths))
      registered = true
    }
    current = fn
  })
  onBeforeUnmount(() => {
    if (current === fn) current = null
  })
}
