import { call } from './api'

/**
 * Opens the Settings window, or focuses it if already open.
 * @return Resolves once the window is shown.
 */
export async function openSettings(): Promise<void> {
  if ((await tiny.win.windows()).includes('settings')) return void (await call('showWindow', { id: 'settings' }))
  tiny.win.open('settings', {
    page: 'settings.html',
    title: 'Settings',
    size: '760x720',
    minSize: '640x480',
    chrome: { frame: false, windowControls: ['close', 'minimize'], windowControlsPos: { x: 16, y: 20 } },
    // minSize and windowControlsPos are supported by the launcher but missing from tiny.d.ts.
  } as TinyOpenWindowOptions)
}

/**
 * Installs the macOS app menu with Check for Updates… and Settings…, a File menu with New Note, and the standard Edit menu.
 * Other shortcuts stay out of the menu bar so user remaps in Settings apply.
 */
export function installMenu(): void {
  tiny.menu.set([
    {
      role: 'app',
      items: [
        { id: 'checkForUpdates', label: 'Check for Updates…' },
        { id: 'settings', label: 'Settings…', key: ',' },
      ],
    },
    { title: 'File', items: [{ id: 'newNote', label: 'New Note', key: 'N' }] },
    { role: 'edit' },
  ])
}
