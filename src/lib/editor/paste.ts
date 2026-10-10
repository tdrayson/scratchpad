const MARKDOWN_BLOCK = /^\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s?|```|- \[[ xX]\]\s|\[[ xX]?\]\s)/m

const STRUCTURAL_HTML = /<(ul|ol|li|h[1-6]|blockquote|pre|table|img)\b/i

/**
 * Whether pasted plain text uses Markdown block syntax worth converting (lists, headings, quotes, fences).
 * @param text - The clipboard's plain text.
 * @return True if any line starts like a Markdown block.
 */
export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_BLOCK.test(text)
}

/**
 * Whether clipboard HTML is just styled text (TextEdit, Notes, a code editor) rather than real structure.
 * Such HTML loses to the plain text when that text is Markdown.
 * @param html - The clipboard's HTML, if any.
 * @return True when there is no HTML or it has no lists, headings, quotes, code blocks, tables or images.
 */
export function isPlainHtml(html: string | undefined): boolean {
  return !html || (!STRUCTURAL_HTML.test(html) && !html.includes('data-pm-slice'))
}
