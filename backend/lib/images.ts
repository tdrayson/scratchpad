import type { Database } from 'tjs:sqlite'
import { IMAGE_SCHEME, MAX_IMAGE_BYTES, mimeForPath } from '../../src/shared/images'
import { all, run } from './db'

export interface StoredImage {
  mime: string
  data: Uint8Array
}

export class ImageStore {
  private db: Database

  /**
   * @param db - The open notes database.
   */
  constructor(db: Database) {
    this.db = db
  }

  /**
   * Stores an image.
   * @param noteId - Note it was added to.
   * @param mime - e.g. 'image/png'.
   * @param data - The image bytes.
   * @param now - Time in epoch ms.
   * @param id - Id to store it under; a new one by default.
   * @return The image id.
   */
  add(noteId: string, mime: string, data: Uint8Array, now: number, id: string = crypto.randomUUID()): string {
    if (data.length > MAX_IMAGE_BYTES) throw new Error('Image too large')
    run(
      this.db,
      'INSERT INTO images (id, note_id, mime, data, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      noteId,
      mime,
      data,
      now,
    )
    return id
  }

  /**
   * Stores image files from disk, skipping anything that isn't a supported image or is too large.
   * @param noteId - Note they were added to.
   * @param paths - Absolute file paths.
   * @param now - Time in epoch ms.
   * @return Ids of the stored images, and how many files were skipped.
   */
  async addFiles(noteId: string, paths: string[], now: number): Promise<{ ids: string[]; skipped: number }> {
    const ids: string[] = []
    for (const path of paths) {
      const mime = mimeForPath(path)
      if (!mime || (await tjs.stat(path)).size > MAX_IMAGE_BYTES) continue
      ids.push(this.add(noteId, mime, await tjs.readFile(path), now))
    }
    return { ids, skipped: paths.length - ids.length }
  }

  /**
   * One image.
   * @param id - Image id.
   * @return The image, or null if it doesn't exist.
   */
  get(id: string): StoredImage | null {
    const row = all(this.db, 'SELECT mime, data FROM images WHERE id = ?', id)[0]
    return row ? { mime: row.mime, data: row.data } : null
  }

  /**
   * Deletes images no note points at any more. Recent ones are kept so undo can bring them back.
   * @param cutoff - Only images added before this time (epoch ms) are deleted.
   * @return How many images were deleted.
   */
  purgeUnused(cutoff: number): number {
    const unused = `created_at < ? AND NOT EXISTS (SELECT 1 FROM notes WHERE instr(notes.markdown, ? || images.id) > 0)`
    const n = all(this.db, `SELECT COUNT(*) c FROM images WHERE ${unused}`, cutoff, IMAGE_SCHEME)[0].c as number
    if (n) run(this.db, `DELETE FROM images WHERE ${unused}`, cutoff, IMAGE_SCHEME)
    return n
  }
}
