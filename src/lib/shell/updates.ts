import { useView } from '@/composables/useView'
import { call } from '@/lib/api'
import { RELEASES_URL } from '@/shared/updates'

/** Checks GitHub for a newer release and reports in a dialog, offering the download when there is one. */
export async function checkForUpdates(): Promise<void> {
  const { dialog } = useView()
  let status
  try {
    status = await call('checkForUpdate')
  } catch {
    dialog.value = { title: "Couldn't check for updates", message: 'Check your connection and try again.' }
    return
  }
  if (!status.available) {
    dialog.value = { title: "You're up to date", message: `Scratchpad ${status.current} is the latest version.` }
    return
  }
  dialog.value = {
    title: `Scratchpad ${status.latest} is available`,
    message: `You have ${status.current}. Download the new version and replace the app in Applications; your notes stay put.`,
    confirm: { label: 'Download Now', run: () => void tiny.app.shell.open(RELEASES_URL).catch(() => {}) },
    cancelLabel: 'Later',
  }
}
