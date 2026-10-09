export interface Autosave<T> {
  /** Queues a save of a snapshot for a note, restarting the debounce. */
  schedule: (id: string, snapshot: T) => void
  /** Writes any pending save now. */
  flush: () => void
  /** Drops any pending save without writing it. */
  cancel: () => void
}

/**
 * Debounced saver that pins each pending snapshot to the note it came from.
 * @param write - Persists a snapshot for a note id.
 * @param delay - Debounce in ms.
 * @return Schedule, flush and cancel controls.
 */
export function createAutosave<T>(write: (id: string, snapshot: T) => void, delay = 400): Autosave<T> {
  let pending: { id: string; snapshot: T } | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Writes and clears the pending snapshot, if any. */
  function flush(): void {
    clearTimeout(timer)
    const p = pending
    pending = null
    if (p) write(p.id, p.snapshot)
  }

  /**
   * Queues a snapshot; a pending one for another note is written first.
   * @param id - Note the snapshot belongs to.
   * @param snapshot - The content to save.
   */
  function schedule(id: string, snapshot: T): void {
    if (pending && pending.id !== id) flush()
    pending = { id, snapshot }
    clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  /** Drops the pending snapshot. */
  function cancel(): void {
    clearTimeout(timer)
    pending = null
  }

  return { schedule, flush, cancel }
}
