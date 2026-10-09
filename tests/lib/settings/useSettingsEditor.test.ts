import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Settings } from '@/shared/types'

const calls = vi.hoisted(() => [] as Partial<Settings>[])

vi.mock('@/lib/api', () => ({
  call: vi.fn(async (_method: string, patch: Partial<Settings>) => {
    calls.push(patch)
    const { useSettings } = await import('@/composables/useSettings')
    return useSettings().settings.value
  }),
  on: vi.fn(),
}))

const { useSettings } = await import('@/composables/useSettings')
const { DEFAULT_SETTINGS } = await import('@/shared/defaults')
const { useShortcutEditor } = await import('@/lib/settings/useSettingsEditor')

beforeEach(() => {
  calls.length = 0
  useSettings().settings.value = { ...DEFAULT_SETTINGS, shortcuts: {} }
})

describe('useShortcutEditor', () => {
  it('saves only overrides that differ from the default', () => {
    const { setCombo, isChanged } = useShortcutEditor()
    setCombo('newNote', 'cmd+shift+n')
    expect(calls.at(-1)).toEqual({ shortcuts: { newNote: 'cmd+shift+n' } })
    expect(isChanged('newNote')).toBe(true)
    setCombo('newNote', 'cmd+n')
    expect(calls.at(-1)).toEqual({ shortcuts: {} })
  })

  it('turns quick capture off when cleared and on when recorded', () => {
    const { setCombo, comboFor, isChanged } = useShortcutEditor()
    setCombo('quickCapture', '')
    expect(calls.at(-1)).toEqual({ quickCapture: false })
    expect(comboFor('quickCapture')).toBe('')
    expect(isChanged('quickCapture')).toBe(true)
    setCombo('quickCapture', 'ctrl+space')
    expect(calls.at(-1)).toEqual({ quickCapture: true, shortcuts: { quickCapture: 'ctrl+space' } })
  })

  it('resets a shared row in one write', () => {
    useSettings().settings.value.shortcuts = { prevNote: 'cmd+up', nextNote: 'cmd+down', search: 'cmd+p' }
    useShortcutEditor().reset('prevNote', 'nextNote')
    expect(calls.at(-1)).toEqual({ shortcuts: { search: 'cmd+p' } })
  })
})
