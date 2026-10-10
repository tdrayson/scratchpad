import {
  IMAGE_FOLDER,
  IMAGE_SCHEME,
  MAX_IMAGE_BYTES,
  extensionFor,
  imageIds,
  mimeForPath,
  rewriteImageLinks,
} from '../../src/shared/images'
import type { NoteSummary } from '../../src/shared/types'
import {
  ARCHIVE_FOLDER,
  exportName,
  fileName,
  isNoteFile,
  type ImportFile,
  type ImportImage,
} from '../../src/shared/transfer'
import type { StoredImage } from './images'

/** Larger files are skipped on import; nothing written in Scratchpad gets near it. */
const MAX_FILE_BYTES = 5 * 1024 * 1024

/**
 * Runs a command and fails if it does.
 * @param args - Command and arguments.
 */
async function sh(args: string[]): Promise<void> {
  const { exit_status } = await tjs.spawn(args, { stdout: 'ignore', stderr: 'ignore' }).wait()
  if (exit_status !== 0) throw new Error(`${args[0]} exited with ${exit_status}`)
}

/**
 * Whether a path exists.
 * @param path - Absolute path.
 * @return True if something is there.
 */
async function exists(path: string): Promise<boolean> {
  try {
    await tjs.stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Runs work in a fresh temporary folder that is removed afterwards.
 * @param fn - Work given the folder's path.
 * @return Whatever the work returns.
 */
async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await tjs.makeTempDir(`${tjs.tmpDir}/scratchpad-XXXXXX`)
  try {
    return await fn(dir)
  } finally {
    await tjs.remove(dir, { recursive: true }).catch(() => {})
  }
}

/**
 * Writes a note's stored images into the export's images folder and points its links at them.
 * @param markdown - Note Markdown.
 * @param root - Export folder.
 * @param prefix - Path from the note's folder back to the root, e.g. '../' for Archive.
 * @param getImage - Looks up a stored image.
 * @param written - Image files already written, by id; added to.
 * @return The Markdown with relative image links.
 */
async function exportImages(
  markdown: string,
  root: string,
  prefix: string,
  getImage: (id: string) => StoredImage | null,
  written: Map<string, string>,
): Promise<string> {
  const files = new Map<string, string>()
  for (const id of imageIds(markdown)) {
    if (!written.has(id)) {
      const image = getImage(id)
      if (!image) continue
      if (!written.size) await tjs.makeDir(`${root}/${IMAGE_FOLDER}`)
      const name = `${id}.${extensionFor(image.mime)}`
      await tjs.writeFile(`${root}/${IMAGE_FOLDER}/${name}`, image.data)
      written.set(id, name)
    }
    files.set(IMAGE_SCHEME + id, `${prefix}${IMAGE_FOLDER}/${written.get(id)}`)
  }
  return rewriteImageLinks(markdown, (src) => files.get(src) ?? null)
}

/**
 * Zips every note into one Markdown file each, archived notes optionally in an Archive subfolder,
 * and their images in an images folder. File dates are set to each note's last edit, so an import puts them back.
 * @param destDir - Folder the zip is saved in.
 * @param notes - Every note.
 * @param includeArchived - Whether to include the archive.
 * @param now - Export time in epoch ms, for the name.
 * @param getImage - Looks up a stored image by id.
 * @return Where the zip went and how many notes it holds.
 */
export async function exportZip(
  destDir: string,
  notes: NoteSummary[],
  includeArchived: boolean,
  now: number,
  getImage: (id: string) => StoredImage | null,
): Promise<{ path: string; count: number }> {
  const name = exportName(now)
  const chosen = notes.filter((n) => includeArchived || n.archivedAt === null)
  return withTempDir(async (tmp) => {
    const root = `${tmp}/${name}`
    const used = new Map<string, Set<string>>()
    const written = new Map<string, string>()
    await tjs.makeDir(root)
    for (const note of chosen) {
      const archived = note.archivedAt !== null
      const dir = archived ? `${root}/${ARCHIVE_FOLDER}` : root
      if (!used.has(dir)) {
        await tjs.makeDir(dir, { recursive: true })
        used.set(dir, new Set())
      }
      const file = `${dir}/${fileName(note.title, used.get(dir)!)}`
      await tjs.writeFile(file, await exportImages(note.markdown, root, archived ? '../' : '', getImage, written))
      await tjs.utime(file, new Date(note.updatedAt), new Date(note.updatedAt))
    }
    let path = `${destDir}/${name}.zip`
    for (let i = 2; await exists(path); i++) path = `${destDir}/${name} ${i}.zip`
    await sh(['ditto', '-c', '-k', '--keepParent', root, path])
    return { path, count: chosen.length }
  })
}

/**
 * Collects note files under a folder, recursively.
 * @param dir - Absolute folder path.
 * @param rel - The folder's path relative to the import root.
 * @param out - Files found so far; appended to.
 */
async function walk(dir: string, rel: string, out: ImportFile[]): Promise<void> {
  for await (const entry of await tjs.readDir(dir)) {
    const abs = `${dir}/${entry.name}`
    const path = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory && !entry.name.startsWith('.') && entry.name !== '__MACOSX') await walk(abs, path, out)
    else if (entry.isFile && isNoteFile(path)) await readNote(abs, path, out)
  }
}

/**
 * Reads one note file, skipping anything too large.
 * @param abs - Absolute path.
 * @param path - Path relative to the import root.
 * @param out - Files found so far; appended to.
 */
async function readNote(abs: string, path: string, out: ImportFile[]): Promise<void> {
  const st = await tjs.stat(abs)
  if (st.size > MAX_FILE_BYTES) return
  const text = new TextDecoder().decode(await tjs.readFile(abs))
  out.push({ path, text, modifiedAt: st.mtim.getTime(), images: await readLinkedImages(text, abs) })
}

/**
 * Reads the local images a Markdown file links to by relative path; web links and missing files are left alone.
 * @param text - The file's Markdown.
 * @param abs - The file's absolute path, for resolving links.
 * @return Images keyed by the link target as written.
 */
async function readLinkedImages(text: string, abs: string): Promise<Record<string, ImportImage>> {
  const dir = abs.slice(0, abs.lastIndexOf('/'))
  const images: Record<string, ImportImage> = {}
  const targets: string[] = []
  rewriteImageLinks(text, (src) => (targets.push(src), null))
  for (const src of targets) {
    const mime = mimeForPath(src)
    if (!mime || images[src] || /^[a-z][\w+.-]*:/i.test(src) || src.startsWith('/')) continue
    try {
      const file = `${dir}/${decodeURI(src)}`
      if ((await tjs.stat(file)).size > MAX_IMAGE_BYTES) continue
      images[src] = { mime, data: await tjs.readFile(file) }
    } catch {
      // Missing or unreadable: the link stays as written.
    }
  }
  return images
}

/**
 * Reads every note file from dropped or picked paths: zips, folders or loose Markdown files.
 * @param paths - Absolute paths.
 * @return The files found, with paths relative to each zip or folder.
 */
export async function readImport(paths: string[]): Promise<ImportFile[]> {
  const out: ImportFile[] = []
  for (const abs of paths) {
    const st = await tjs.stat(abs)
    const name = abs.split('/').pop() ?? ''
    if (st.isDirectory) await walk(abs, name, out)
    else if (name.toLowerCase().endsWith('.zip')) {
      await withTempDir(async (tmp) => {
        await sh(['ditto', '-x', '-k', abs, tmp])
        await walk(tmp, '', out)
      })
    } else if (isNoteFile(name)) await readNote(abs, name, out)
  }
  return out
}
