/**
 * Plural count, e.g. '1 note' or '3 notes'.
 * @param n - The count.
 * @param word - Singular noun.
 * @return The count with the noun.
 */
const count = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Status line after an export.
 * @param n - Notes in the zip.
 * @param path - Where the zip was saved.
 * @return e.g. 'Exported 12 notes to Scratchpad Export 2026-10-09.zip'.
 */
export function exportMessage(n: number, path: string): string {
  return `Exported ${count(n, 'note')} to ${path.split('/').pop()}`
}

/**
 * Status line after an import.
 * @param r - Imported, of which archived, and skipped duplicates.
 * @return e.g. 'Imported 12 notes, 3 into the archive. Skipped 2 duplicates.'
 */
export function importMessage(r: { imported: number; archived: number; skipped: number }): string {
  if (!r.imported && !r.skipped) return 'No Markdown files found.'
  const parts = [
    r.imported
      ? `Imported ${count(r.imported, 'note')}${r.archived ? `, ${r.archived} into the archive` : ''}.`
      : 'Nothing new to import.',
  ]
  if (r.skipped) parts.push(`Skipped ${count(r.skipped, 'duplicate')}.`)
  return parts.join(' ')
}
