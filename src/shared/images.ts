/** How note Markdown points at an image stored in the database: `![alt](scratchpad-image:<id>)`. */
export const IMAGE_SCHEME = 'scratchpad-image:'

/** Folder that holds images inside an export. */
export const IMAGE_FOLDER = 'images'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** File extension → MIME type for images Scratchpad accepts. */
export const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
}

const IMAGE_LINK = /!\[([^\]]*)\]\((?:<([^>]+)>|([^)\s]+))(?:\s+"[^"]*")?\)/g

/**
 * MIME type for an image path, by extension.
 * @param path - File name or path.
 * @return The MIME type, or null if it isn't a supported image.
 */
export function mimeForPath(path: string): string | null {
  return IMAGE_TYPES[path.split('.').pop()?.toLowerCase() ?? ''] ?? null
}

/**
 * File extension for a MIME type.
 * @param mime - e.g. 'image/jpeg'.
 * @return e.g. 'jpg'; 'png' for anything unknown.
 */
export function extensionFor(mime: string): string {
  return Object.keys(IMAGE_TYPES).find((ext) => IMAGE_TYPES[ext] === mime) ?? 'png'
}

/**
 * Ids of every stored image a note's Markdown points at.
 * @param markdown - Note Markdown.
 * @return Unique ids in order of appearance.
 */
export function imageIds(markdown: string): string[] {
  const ids = [...markdown.matchAll(IMAGE_LINK)].map((m) => m[2] ?? m[3]).filter((src) => src.startsWith(IMAGE_SCHEME))
  return [...new Set(ids.map((src) => src.slice(IMAGE_SCHEME.length)))]
}

/**
 * Rewrites the target of every image link.
 * @param markdown - Note Markdown.
 * @param fn - Maps a link target to its replacement, or null to leave it.
 * @return The Markdown with links rewritten.
 */
export function rewriteImageLinks(markdown: string, fn: (src: string) => string | null): string {
  return markdown.replace(IMAGE_LINK, (all, alt: string, bracketed?: string, bare?: string) => {
    const next = fn(bracketed ?? bare ?? '')
    if (next === null) return all
    return `![${alt}](${/\s/.test(next) ? `<${next}>` : next})`
  })
}

/**
 * Removes image links, for titles, previews and word counts.
 * @param text - Markdown text.
 * @return The text without images.
 */
export function stripImages(text: string): string {
  return text.replace(IMAGE_LINK, '')
}
