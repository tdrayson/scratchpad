import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useView } from '@/composables/useView'

const call = vi.fn()
vi.mock('@/lib/api', () => ({ call: (...a: unknown[]) => call(...a) }))

const open = vi.fn(async () => true)
;(globalThis as unknown as { tiny: unknown }).tiny = { app: { shell: { open } } }

const { checkForUpdates } = await import('@/lib/shell/updates')
const { dialog } = useView()

describe('checkForUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dialog.value = null
  })

  it('offers Download Now, which opens the Releases page', async () => {
    call.mockResolvedValue({ current: '0.4.0', latest: '0.4.1', available: true })
    await checkForUpdates()
    expect(dialog.value?.title).toBe('Scratchpad 0.4.1 is available')
    expect(dialog.value?.confirm?.label).toBe('Download Now')
    dialog.value?.confirm?.run()
    expect(open).toHaveBeenCalledWith('https://github.com/tdrayson/scratchpad/releases/latest')
  })

  it('says so when already up to date', async () => {
    call.mockResolvedValue({ current: '0.4.1', latest: '0.4.1', available: false })
    await checkForUpdates()
    expect(dialog.value).toEqual({ title: "You're up to date", message: 'Scratchpad 0.4.1 is the latest version.' })
  })

  it('reports a failed check', async () => {
    call.mockRejectedValue(new Error('offline'))
    await checkForUpdates()
    expect(dialog.value?.title).toBe("Couldn't check for updates")
  })
})
