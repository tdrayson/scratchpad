import type { NoteSummary } from '../../src/shared/types'

/**
 * Filesystem-safe, unique file name for a note title.
 * @param title - The note's title.
 * @param used - Lowercased names already taken in the folder; the result is added.
 * @return e.g. 'Travel The Unknown.md' or 'Untitled 2.md'.
 */
export function fileName(title: string, used: Set<string>): string {
  const base = (title || 'Untitled').replace(/[\/\\:*?"<>|\u0000-\u001f]/g, '-').slice(0, 80).trim() || 'Untitled'
  let name = `${base}.md`
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base} ${i}.md`
  used.add(name.toLowerCase())
  return name
}

/**
 * Writes one Markdown file per note, with archived notes in an Archive subfolder.
 * @param dir - Destination folder.
 * @param notes - Notes to export.
 * @return How many files were written.
 */
export async function exportNotes(dir: string, notes: NoteSummary[]): Promise<number> {
  const used = new Map<string, Set<string>>()
  for (const note of notes) {
    const target = note.archivedAt === null ? dir : `${dir}/Archive`
    if (!used.has(target)) {
      await tjs.makeDir(target, { recursive: true })
      used.set(target, new Set())
    }
    await tjs.writeFile(`${target}/${fileName(note.title, used.get(target)!)}`, note.markdown)
  }
  return notes.length
}
