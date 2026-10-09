import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosave } from '@/lib/editor/autosave'

describe('createAutosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces to the last snapshot', () => {
    const write = vi.fn()
    const s = createAutosave(write, 400)
    s.schedule('a', 1)
    vi.advanceTimersByTime(300)
    s.schedule('a', 2)
    vi.advanceTimersByTime(399)
    expect(write).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(write).toHaveBeenCalledExactlyOnceWith('a', 2)
  })

  it('flush writes now and only once', () => {
    const write = vi.fn()
    const s = createAutosave(write)
    s.schedule('a', 1)
    s.flush()
    s.flush()
    vi.runAllTimers()
    expect(write).toHaveBeenCalledExactlyOnceWith('a', 1)
  })

  it('never saves a snapshot into another note', () => {
    const write = vi.fn()
    const s = createAutosave(write)
    s.schedule('a', 'from a')
    s.schedule('b', 'from b')
    expect(write).toHaveBeenCalledExactlyOnceWith('a', 'from a')
    vi.runAllTimers()
    expect(write).toHaveBeenLastCalledWith('b', 'from b')
    expect(write).toHaveBeenCalledTimes(2)
  })

  it('flush resolves only once the write has landed', async () => {
    let land!: () => void
    const write = vi.fn(() => new Promise<void>((r) => (land = r)))
    const s = createAutosave(write)
    s.schedule('a', 1)
    let done = false
    const flushed = s.flush().then(() => (done = true))
    expect(write).toHaveBeenCalledOnce()
    await Promise.resolve()
    expect(done).toBe(false)
    land()
    await flushed
    expect(done).toBe(true)
  })

  it('cancel drops the pending save', () => {
    const write = vi.fn()
    const s = createAutosave(write)
    s.schedule('a', 1)
    s.cancel()
    vi.runAllTimers()
    expect(write).not.toHaveBeenCalled()
  })
})
