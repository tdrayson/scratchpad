import type { Database } from 'tjs:sqlite'
import { visibleText } from '../../src/shared/text'
import type { Note, NotePatch, NoteSummary, SearchHit } from '../../src/shared/types'
import { all, run } from './db'

const SUMMARY_COLS = 'id, title, markdown, created_at, updated_at, kept_until, archived_at'

type Row = Record<string, any>

/**
 * A line of Markdown as plain text, with block and inline markers stripped.
 * @param line - One line of Markdown.
 * @return The plain text.
 */
function plainLine(line: string): string {
  return visibleText(
    line.replace(/^\s{0,3}(#{1,6}(\s+|$)|[-*+]\s+(\[[ xX]\]\s+)?|\d+\.\s+|>\s?)/, '').replace(/[*_`~\\]/g, ''),
  )
}

/**
 * The note's lines as plain text, skipping fences, rules and lines with nothing visible.
 * @param markdown - The note's Markdown.
 * @return Visible lines in order.
 */
function visibleLines(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((l) => !/^\s*(```|---|\*\*\*)\s*$/.test(l))
    .map(plainLine)
    .filter(Boolean)
}

/**
 * Title from the first non-empty line of a note.
 * @param markdown - The note's Markdown.
 * @return Plain-text title, empty for an empty note.
 */
export function deriveTitle(markdown: string): string {
  return (visibleLines(markdown)[0] ?? '').slice(0, 200)
}

/**
 * List-row view of a database row, with preview line and word count.
 * @param row - A notes row.
 * @return The summary.
 */
function summarise(row: Row): NoteSummary {
  const md: string = row.markdown ?? ''
  const lines = visibleLines(md)
  const text = lines.join(' ')
  return {
    id: row.id,
    title: row.title,
    markdown: md,
    preview: (lines[1] ?? '').slice(0, 160),
    words: text ? text.split(' ').length : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    keptUntil: row.kept_until ?? null,
    archivedAt: row.archived_at ?? null,
  }
}

/**
 * Full note from a database row.
 * @param row - A notes row including doc.
 * @return The note.
 */
function toNote(row: Row): Note {
  const { preview: _p, words: _w, ...rest } = summarise(row)
  return { ...rest, doc: row.doc }
}

export class NoteStore {
  private db: Database

  /**
   * @param db - The open notes database.
   */
  constructor(db: Database) {
    this.db = db
  }

  /**
   * Every note, active and archived, most recently edited first.
   * @return Note summaries without document bodies.
   */
  list(): NoteSummary[] {
    return all(this.db, `SELECT ${SUMMARY_COLS} FROM notes ORDER BY updated_at DESC`).map(summarise)
  }

  /**
   * One note with its document body.
   * @param id - Note id.
   * @return The note, or null if it doesn't exist.
   */
  get(id: string): Note | null {
    const row = all(this.db, 'SELECT * FROM notes WHERE id = ?', id)[0]
    return row ? toNote(row) : null
  }

  /**
   * Creates a note.
   * @param now - Creation time in epoch ms.
   * @param markdown - Initial Markdown, e.g. from a ⌘K query.
   * @param doc - Initial TipTap JSON; empty lets the editor build it from Markdown.
   * @return The new note.
   */
  create(now: number, markdown = '', doc = ''): Note {
    const id = crypto.randomUUID()
    run(
      this.db,
      'INSERT INTO notes (id, title, doc, markdown, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      deriveTitle(markdown),
      doc,
      markdown,
      now,
      now,
    )
    return this.get(id)!
  }

  /**
   * Adds imported notes with their original dates, in one transaction.
   * @param list - Each note's Markdown, last-edited time (also used as created) and archive time or null.
   */
  insertAll(list: { markdown: string; modifiedAt: number; archivedAt: number | null }[]): void {
    run(this.db, 'BEGIN')
    try {
      for (const n of list) {
        run(
          this.db,
          'INSERT INTO notes (id, title, doc, markdown, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          crypto.randomUUID(),
          deriveTitle(n.markdown),
          '',
          n.markdown,
          n.modifiedAt,
          n.modifiedAt,
          n.archivedAt,
        )
      }
      run(this.db, 'COMMIT')
    } catch (e) {
      run(this.db, 'ROLLBACK')
      throw e
    }
  }

  /**
   * Saves editor content. Editing clears any Keep date, since the note is active again.
   * @param patch - Note id plus its new TipTap JSON and Markdown.
   * @param now - Save time in epoch ms.
   * @return False if the note no longer exists.
   */
  save(patch: NotePatch, now: number): boolean {
    if (!this.get(patch.id)) return false
    run(
      this.db,
      'UPDATE notes SET doc = ?, markdown = ?, title = ?, updated_at = ?, kept_until = NULL WHERE id = ?',
      patch.doc,
      patch.markdown,
      deriveTitle(patch.markdown),
      now,
      patch.id,
    )
    return true
  }

  /**
   * Moves a note to the archive.
   * @param id - Note id.
   * @param now - Archive time in epoch ms.
   */
  archive(id: string, now: number): void {
    run(this.db, 'UPDATE notes SET archived_at = ? WHERE id = ?', now, id)
  }

  /**
   * Brings a note back from the archive, counting as fresh activity.
   * @param id - Note id.
   * @param now - Restore time in epoch ms.
   */
  restore(id: string, now: number): void {
    run(this.db, 'UPDATE notes SET archived_at = NULL, kept_until = NULL, updated_at = ? WHERE id = ?', now, id)
  }

  /**
   * Undoes an archive exactly, leaving the note's dates untouched.
   * @param id - Note id.
   */
  unarchive(id: string): void {
    run(this.db, 'UPDATE notes SET archived_at = NULL WHERE id = ?', id)
  }

  /**
   * Keeps a stale note out of Review until a date.
   * @param id - Note id.
   * @param until - When the note returns, in epoch ms.
   */
  keep(id: string, until: number): void {
    run(this.db, 'UPDATE notes SET kept_until = ? WHERE id = ?', until, id)
  }

  /**
   * Permanently deletes a note.
   * @param id - Note id.
   */
  remove(id: string): void {
    run(this.db, 'DELETE FROM notes WHERE id = ?', id)
  }

  /**
   * Permanently deletes every archived note.
   * @return How many notes were deleted.
   */
  emptyArchive(): number {
    const n = all(this.db, 'SELECT COUNT(*) c FROM notes WHERE archived_at IS NOT NULL')[0].c as number
    run(this.db, 'DELETE FROM notes WHERE archived_at IS NOT NULL')
    return n
  }

  /**
   * Permanently deletes notes archived at or before a cutoff.
   * @param cutoff - Archive time in epoch ms; anything archived by then goes.
   * @return How many notes were deleted.
   */
  purgeArchivedBefore(cutoff: number): number {
    const n = all(this.db, 'SELECT COUNT(*) c FROM notes WHERE archived_at IS NOT NULL AND archived_at <= ?', cutoff)[0]
      .c as number
    if (n) run(this.db, 'DELETE FROM notes WHERE archived_at IS NOT NULL AND archived_at <= ?', cutoff)
    return n
  }

  /**
   * Full-text search across active and archived notes, prefix-matching each word. Active notes rank first.
   * @param query - What the user typed.
   * @param limit - Maximum hits.
   * @return Hits with a highlighted snippet.
   */
  search(query: string, limit = 20): SearchHit[] {
    const terms = query
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map((t) => `"${t}"*`)
    if (!terms.length) return []
    const rows = all(
      this.db,
      `SELECT ${SUMMARY_COLS.split(', ').map((c) => 'n.' + c).join(', ')},
        snippet(notes_fts, 1, char(1), char(2), '…', 10) AS snippet
       FROM notes_fts JOIN notes n ON n.rowid = notes_fts.rowid
       WHERE notes_fts MATCH ? ORDER BY n.archived_at IS NOT NULL, rank LIMIT ?`,
      terms.join(' '),
      limit,
    )
    return rows.map((r) => ({ note: summarise(r), snippet: visibleText(String(r.snippet)) }))
  }
}
