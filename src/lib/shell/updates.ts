import { call } from '@/lib/api'
import { RELEASES_URL } from '@/shared/updates'

/** Checks GitHub for a newer release and reports in a dialog, offering the download when there is one. */
export async function checkForUpdates(): Promise<void> {
  let status
  try {
    status = await call('checkForUpdate')
  } catch {
    await tiny.dialog.alert("Couldn't check for updates", 'Check your connection and try again.')
    return
  }
  if (!status.available) {
    await tiny.dialog.alert("You're up to date", `Scratchpad ${status.current} is the latest version.`)
    return
  }
  const download = await tiny.dialog.confirm(`Scratchpad ${status.latest} is available`, {
    detail: `You have ${status.current}. Download the new version and replace the app in Applications; your notes stay put.`,
    ok: 'Download Now',
    cancel: 'Later',
  })
  if (download) await tiny.app.shell.open(RELEASES_URL)
}
