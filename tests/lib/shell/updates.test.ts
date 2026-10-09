import { beforeEach, describe, expect, it, vi } from 'vitest'

const call = vi.fn()
vi.mock('@/lib/api', () => ({ call: (...a: unknown[]) => call(...a) }))

const alert = vi.fn(async () => true)
const confirm = vi.fn(async () => true)
const open = vi.fn(async () => true)
;(globalThis as unknown as { tiny: unknown }).tiny = { dialog: { alert, confirm }, app: { shell: { open } } }

const { checkForUpdates } = await import('@/lib/shell/updates')

describe('checkForUpdates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers Download Now and opens the Releases page when accepted', async () => {
    call.mockResolvedValue({ current: '0.4.0', latest: '0.4.1', available: true })
    await checkForUpdates()
    expect(confirm).toHaveBeenCalledWith(
      'Scratchpad 0.4.1 is available',
      expect.objectContaining({ ok: 'Download Now' }),
    )
    expect(open).toHaveBeenCalledWith('https://github.com/tdrayson/scratchpad/releases/latest')
  })

  it('does nothing more when the user picks Later', async () => {
    call.mockResolvedValue({ current: '0.4.0', latest: '0.4.1', available: true })
    confirm.mockResolvedValueOnce(false)
    await checkForUpdates()
    expect(open).not.toHaveBeenCalled()
  })

  it('says so when already up to date', async () => {
    call.mockResolvedValue({ current: '0.4.1', latest: '0.4.1', available: false })
    await checkForUpdates()
    expect(alert).toHaveBeenCalledWith("You're up to date", 'Scratchpad 0.4.1 is the latest version.')
  })

  it('reports a failed check', async () => {
    call.mockRejectedValue(new Error('offline'))
    await checkForUpdates()
    expect(alert).toHaveBeenCalledWith("Couldn't check for updates", expect.any(String))
  })
})
