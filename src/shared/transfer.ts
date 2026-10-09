/** Folder that holds archived notes inside an export. */
export const ARCHIVE_FOLDER = 'Archive'

/** File extensions read as notes on import. */
export const NOTE_EXTENSIONS = ['md', 'markdown', 'txt']

/** A Markdown file found while importing. */
export interface ImportFile {
  /** Path relative to the dropped folder or zip root, e.g. 'Export/Archive/Old.md'. */
  path: string
  text: string
  /** Last modified, in epoch ms. */
  modifiedAt: number
}

/** A note to create from an imported file. */
export interface ImportNote {
  markdown: string
  modifiedAt: number
  archived: boolean
}

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
 * Name of the folder (and zip) an export is written to.
 * @param now - Export time in epoch ms.
 * @return e.g. 'Scratchpad Export 2026-10-09'.
 */
export function exportName(now: number): string {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `Scratchpad Export ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Whether a path is a note file worth importing; skips hidden files and macOS zip debris.
 * @param path - Relative path.
 * @return True for a visible .md, .markdown or .txt file.
 */
export function isNoteFile(path: string): boolean {
  const parts = path.split('/')
  if (parts.some((p) => p.startsWith('.') || p === '__MACOSX')) return false
  const ext = parts[parts.length - 1].split('.').pop()?.toLowerCase() ?? ''
  return NOTE_EXTENSIONS.includes(ext)
}

/**
 * Whether an imported file sits in an Archive folder at any depth.
 * @param path - Relative path.
 * @return True if a parent folder is named Archive.
 */
export function isArchivedPath(path: string): boolean {
  return path.split('/').slice(0, -1).some((p) => p.toLowerCase() === ARCHIVE_FOLDER.toLowerCase())
}

/**
 * Gives a file's text a title line: kept if it opens with `# `, otherwise the file name is added as one.
 * @param text - File contents.
 * @param path - Relative path, for the file name.
 * @return Markdown starting with a `# ` title.
 */
export function titled(text: string, path: string): string {
  const body = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim()
  if (/^# \S/.test(body)) return body
  const name = (path.split('/').pop() ?? '').replace(/\.[^.]+$/, '').trim() || 'Untitled'
  return body ? `# ${name}\n\n${body}` : `# ${name}`
}

/**
 * Turns imported files into notes, skipping any identical to an existing note or an earlier file.
 * @param files - Files found in the import.
 * @param existing - Markdown of every note already stored, archived included.
 * @return Notes to create, and how many files were skipped as duplicates.
 */
export function planImport(files: ImportFile[], existing: string[]): { notes: ImportNote[]; skipped: number } {
  const seen = new Set(existing.map((m) => m.trim()))
  const notes: ImportNote[] = []
  let skipped = 0
  for (const file of files) {
    const markdown = titled(file.text, file.path)
    if (seen.has(markdown)) {
      skipped++
      continue
    }
    seen.add(markdown)
    notes.push({ markdown, modifiedAt: file.modifiedAt, archived: isArchivedPath(file.path) })
  }
  return { notes, skipped }
}
