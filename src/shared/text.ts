const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }

/**
 * Text as a reader sees it: HTML entities decoded, non-breaking and zero-width spaces normalised.
 * @param text - Raw text, e.g. a line of serialised Markdown.
 * @return The cleaned text, whitespace collapsed and trimmed.
 */
export function visibleText(text: string): string {
  return text
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (_, name: string) => ENTITIES[name])
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[\s ]+/g, ' ')
    .trim()
}
