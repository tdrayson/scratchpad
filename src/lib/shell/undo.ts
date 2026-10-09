import type { ToastState } from '@/composables/useView'
import { comboFromEvent } from '@/shared/shortcuts'

type KeyLike = Pick<KeyboardEvent, 'code' | 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>

/**
 * Whether ⌘Z should undo the toast's action rather than reach the editor.
 * @param e - The keydown event.
 * @param toast - The current toast, if any.
 * @return True when the key is ⌘Z and the toast offers Undo.
 */
export function routesToToast(e: KeyLike, toast: ToastState | null): boolean {
  return comboFromEvent(e) === 'cmd+z' && toast?.action?.label === 'Undo'
}
