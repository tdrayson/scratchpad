export const RELEASES_URL = 'https://github.com/tdrayson/scratchpad/releases/latest'
export const LATEST_RELEASE_API = 'https://api.github.com/repos/tdrayson/scratchpad/releases/latest'

export interface UpdateStatus {
  current: string
  latest: string
  available: boolean
}

/**
 * Parses 'v1.2.3' or '1.2.3' into numbers; missing parts count as 0.
 * @param version - A version string or release tag.
 * @return Major, minor and patch.
 */
function parts(version: string): number[] {
  const nums = version.replace(/^v/, '').split(/[.-]/).slice(0, 3).map(Number)
  return [0, 1, 2].map((i) => (Number.isFinite(nums[i]) ? nums[i] : 0))
}

/**
 * Whether `latest` is a higher version than `current`.
 * @param latest - Newest release, e.g. 'v0.4.0'.
 * @param current - Running version, e.g. '0.3.0'.
 * @return True when an update is available.
 */
export function isNewer(latest: string, current: string): boolean {
  const a = parts(latest)
  const b = parts(current)
  const i = a.findIndex((n, j) => n !== b[j])
  return i !== -1 && a[i] > b[i]
}

/**
 * Status line for the Settings page after a check.
 * @param s - Result of the check.
 * @return e.g. 'Scratchpad 0.4.0 is available.'
 */
export function updateMessage(s: UpdateStatus): string {
  return s.available ? `Scratchpad ${s.latest} is available.` : `You're on the latest version (${s.current}).`
}
