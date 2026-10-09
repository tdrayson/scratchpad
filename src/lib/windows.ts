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
 * Installs the macOS app menu: Settings… in the app menu, plus a Note menu mirroring the main shortcuts.
 */
export function installMenu(): void {
  tiny.menu.set([
    { role: 'app', items: [{ id: 'settings', label: 'Settings…', key: ',' }] },
    { role: 'edit' },
  ])
}
