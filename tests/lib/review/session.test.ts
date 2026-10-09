import { describe, expect, it } from 'vitest'
import { MAX_SEGMENTS, progressDisplay, reviewAction, reviewState } from '@/lib/review/session'

const q = (...ids: string[]) => ids.map((id) => ({ id }))

/**
 * A keydown event dispatched from an element, so `target` is set.
 * @param init - Event fields.
 * @param target - Element to dispatch from.
 * @return The dispatched event.
 */
function key(init: KeyboardEventInit, target: HTMLElement = document.body): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}

describe('review session', () => {
  it('starts at the oldest note', () => {
    const s = reviewState(q('a', 'b', 'c'), [])
    expect(s.current?.id).toBe('a')
    expect(s.upNext.map((n) => n.id)).toEqual(['b', 'c'])
    expect([s.position, s.total, s.skipped]).toEqual([1, 3, 0])
  })

  it('counts archived notes that left the queue', () => {
    const s = reviewState(q('b', 'c'), ['a'])
    expect(s.current?.id).toBe('b')
    expect([s.position, s.total]).toEqual([2, 3])
  })

  it('moves past skipped notes and remembers them', () => {
    const s = reviewState(q('a', 'b'), ['a'])
    expect(s.current?.id).toBe('b')
    expect([s.position, s.total, s.skipped]).toEqual([2, 2, 1])
    const done = reviewState(q('a'), ['a', 'b'])
    expect(done.current).toBeNull()
    expect(done.skipped).toBe(1)
  })

  it('shows segments, or a bar for long sessions', () => {
    expect(progressDisplay(2, 1)).toEqual({ kind: 'segments', done: [true, false] })
    expect(progressDisplay(MAX_SEGMENTS + 8, 5)).toEqual({ kind: 'bar', fraction: 0.25 })
  })
})

describe('review keys', () => {
  it('maps E, K, Enter, → and S', () => {
    expect(reviewAction(key({ code: 'KeyE', key: 'e' }))).toBe('archive')
    expect(reviewAction(key({ code: 'KeyK', key: 'k' }))).toBe('keep')
    expect(reviewAction(key({ code: 'Enter', key: 'Enter' }))).toBe('open')
    expect(reviewAction(key({ code: 'ArrowRight', key: 'ArrowRight' }))).toBe('skip')
    expect(reviewAction(key({ code: 'KeyS', key: 's' }))).toBe('skip')
  })

  it('ignores modified keys, fields, menus and Enter on buttons', () => {
    expect(reviewAction(key({ code: 'KeyE', key: 'e', metaKey: true }))).toBeNull()
    const input = document.body.appendChild(document.createElement('input'))
    expect(reviewAction(key({ code: 'KeyE', key: 'e' }, input))).toBeNull()
    const menu = document.body.appendChild(document.createElement('div'))
    menu.setAttribute('role', 'menu')
    const item = menu.appendChild(document.createElement('div'))
    expect(reviewAction(key({ code: 'KeyK', key: 'k' }, item))).toBeNull()
    const button = document.body.appendChild(document.createElement('button'))
    expect(reviewAction(key({ code: 'Enter', key: 'Enter' }, button))).toBeNull()
    expect(reviewAction(key({ code: 'KeyE', key: 'e' }, button))).toBe('archive')
  })
})
