import { describe, expect, it } from 'vitest'
import { comboFromEvent, formatCombo, glyphs, resolveShortcuts, validateCombo } from '@/shared/shortcuts'

const ev = (code: string, key: string, m: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
  code,
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...m,
})

describe('comboFromEvent', () => {
  it('uses physical keys so option does not change letters', () => {
    expect(comboFromEvent(ev('KeyK', '˚', { metaKey: true, altKey: true }))).toBe('cmd+alt+k')
  })

  it('names special keys', () => {
    expect(comboFromEvent(ev('Space', ' ', { altKey: true }))).toBe('alt+space')
    expect(comboFromEvent(ev('Comma', ',', { metaKey: true }))).toBe('cmd+,')
    expect(comboFromEvent(ev('ArrowUp', 'ArrowUp', { altKey: true }))).toBe('alt+up')
  })

  it('ignores bare modifiers', () => {
    expect(comboFromEvent(ev('MetaLeft', 'Meta', { metaKey: true }))).toBeNull()
  })
})

describe('display', () => {
  it('renders glyphs', () => {
    expect(glyphs('cmd+shift+c')).toEqual(['⌘', '⇧', 'C'])
    expect(formatCombo('cmd+backspace')).toBe('⌘⌫')
    expect(glyphs('alt+space')).toEqual(['⌥', 'Space'])
  })
})

describe('validateCombo', () => {
  const current = resolveShortcuts({})

  it('rejects reserved combos', () => {
    expect(validateCombo('newNote', 'cmd+q', current)).toEqual({ kind: 'reserved' })
  })

  it('rejects conflicts', () => {
    expect(validateCombo('newNote', 'cmd+k', current)).toEqual({ kind: 'conflict', with: 'search' })
  })

  it('requires a modifier', () => {
    expect(validateCombo('newNote', 'n', current)).toEqual({ kind: 'noModifier' })
  })

  it('accepts free combos and clearing', () => {
    expect(validateCombo('newNote', 'cmd+alt+n', current)).toBeNull()
    expect(validateCombo('newNote', '', current)).toBeNull()
  })
})
