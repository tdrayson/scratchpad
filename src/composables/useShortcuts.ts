import { onBeforeUnmount } from 'vue'
import { matches } from '../shared/shortcuts'
import { useSettings } from './useSettings'

type Handler = (e: KeyboardEvent) => void

const handlers = new Map<string, Handler>()
let installed = false
let paused = 0

/**
 * Routes keydown events to the handler registered for the matching shortcut.
 * @param e - The keyboard event.
 */
function dispatch(e: KeyboardEvent): void {
  if (paused || e.isComposing) return
  const { shortcuts } = useSettings()
  for (const [id, combo] of Object.entries(shortcuts.value)) {
    const fn = handlers.get(id)
    if (fn && combo && matches(e, combo)) {
      e.preventDefault()
      e.stopPropagation()
      fn(e)
      return
    }
  }
}

/**
 * Binds handlers to shortcut ids for the lifetime of the calling component.
 * @param map - Handler per shortcut id (see SHORTCUTS).
 */
export function useShortcuts(map: Record<string, Handler>): void {
  if (!installed) {
    window.addEventListener('keydown', dispatch, { capture: true })
    installed = true
  }
  for (const [id, fn] of Object.entries(map)) handlers.set(id, fn)
  onBeforeUnmount(() => {
    for (const [id, fn] of Object.entries(map)) if (handlers.get(id) === fn) handlers.delete(id)
  })
}

/**
 * Suspends app shortcuts, e.g. while the shortcut recorder listens.
 * @return A function that resumes them.
 */
export function pauseShortcuts(): () => void {
  paused++
  let done = false
  return () => {
    if (!done) paused--
    done = true
  }
}
