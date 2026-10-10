import type { Editor } from '@tiptap/vue-3'
import { call } from '@/lib/api'
import { IMAGE_TYPES, MAX_IMAGE_BYTES, mimeForPath } from '@/shared/images'

/**
 * Inserts stored images at the caret, each in its own paragraph; never inside the title.
 * @param editor - The editor.
 * @param ids - Image ids.
 */
export function insertImages(editor: Editor, ids: string[]): void {
  if (!ids.length) return
  const content = ids.map((id) => ({ type: 'paragraph', content: [{ type: 'image', attrs: { id } }] }))
  const { $from } = editor.state.selection
  if ($from.index(0) === 0) editor.chain().focus().insertContentAt(editor.state.doc.child(0).nodeSize, content).run()
  else editor.chain().focus().insertContent(content).run()
}

/**
 * @param file - A pasted or dropped file.
 * @return Base64 bytes.
 */
function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Stores pasted or dropped image files for a note.
 * @param noteId - Note they're added to.
 * @param files - Files from the clipboard or a drop.
 * @return Ids of the stored images, and how many were skipped as too large.
 */
export async function storeFiles(noteId: string, files: File[]): Promise<{ ids: string[]; skipped: number }> {
  const ids: string[] = []
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) continue
    ids.push((await call('addImage', { noteId, mime: file.type, data: await readBase64(file) })).id)
  }
  return { ids, skipped: files.length - ids.length }
}

/**
 * Image files in a clipboard or drop.
 * @param data - The event's data transfer.
 * @return The image files.
 */
export function imageFiles(data: DataTransfer | null): File[] {
  return [...(data?.files ?? [])].filter((f) => Object.values(IMAGE_TYPES).includes(f.type))
}

/**
 * Whether any path is an image Scratchpad can store.
 * @param paths - File paths.
 * @return True if at least one is.
 */
export function hasImagePath(paths: string[]): boolean {
  return paths.some((p) => mimeForPath(p))
}

/** File-picker types for the /image block. */
export const PICKER_TYPES = Object.keys(IMAGE_TYPES)
