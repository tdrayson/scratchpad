/**
 * Whether a note has no content: nothing typed, or only an empty title marker.
 * @param markdown - The note's Markdown.
 * @return True for a blank note.
 */
export function isBlank(markdown: string): boolean {
  return markdown.replace(/^\s*#{1,6}\s*$/m, '').trim() === ''
}
