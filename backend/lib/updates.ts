import { LATEST_RELEASE_API, isNewer, type UpdateStatus } from '../../src/shared/updates'

/**
 * Asks GitHub for the latest release. Sends nothing but the request itself.
 * @param current - The running app version.
 * @return The running and latest versions, and whether the latest is newer.
 */
export async function fetchUpdate(current: string): Promise<UpdateStatus> {
  const res = await fetch(LATEST_RELEASE_API, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Scratchpad' },
  })
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
  const { tag_name } = (await res.json()) as { tag_name?: string }
  if (!tag_name) throw new Error('No release tag')
  const latest = tag_name.replace(/^v/, '')
  return { current, latest, available: isNewer(latest, current) }
}
