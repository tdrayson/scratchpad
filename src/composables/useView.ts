import { ref } from 'vue'

export type View = 'editor' | 'review' | 'archive'

export interface ToastState {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

export interface DialogState {
  title: string
  message: string
  confirm?: { label: string; run: () => void }
  cancelLabel?: string
}

const view = ref<View>('editor')
const sidebarOpen = ref(true)
const paletteOpen = ref(false)
const toast = ref<ToastState | null>(null)
const dialog = ref<DialogState | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Shows a short-lived toast, replacing any current one.
 * @param message - What happened.
 * @param action - Optional button, e.g. Undo.
 */
function showToast(message: string, action?: ToastState['action']): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { id: Date.now(), message, action }
  toastTimer = setTimeout(() => (toast.value = null), 5000)
}

/**
 * Shared main-window UI state: the current view, sidebar, ⌘K palette, toast and modal dialog.
 * @return Reactive view state and helpers.
 */
export function useView() {
  return { view, sidebarOpen, paletteOpen, toast, dialog, showToast }
}
