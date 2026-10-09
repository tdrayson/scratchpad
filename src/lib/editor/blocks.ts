import type { ChainedCommands } from '@tiptap/vue-3'
import {
  Code,
  Heading1,
  Heading2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from '@lucide/vue'
import type { Component } from 'vue'

export interface BlockDef {
  id: string
  title: string
  desc: string
  /** Markdown that makes the same block, shown muted on the right. */
  hint?: string
  icon: Component
  /** Extra words the filter matches. */
  keywords: string[]
  /** Turns the current block into this one. */
  apply: (chain: ChainedCommands) => ChainedCommands
}

export const BLOCKS: BlockDef[] = [
  { id: 'text', title: 'Text', desc: 'Plain paragraph', icon: Type, keywords: ['paragraph', 'plain', 'p'], apply: (c) => c.setParagraph() },
  { id: 'h1', title: 'Heading 1', desc: 'Large section heading', hint: '#', icon: Heading1, keywords: ['h1', 'title'], apply: (c) => c.setHeading({ level: 1 }) },
  { id: 'h2', title: 'Heading 2', desc: 'Medium section heading', hint: '##', icon: Heading2, keywords: ['h2', 'subtitle'], apply: (c) => c.setHeading({ level: 2 }) },
  { id: 'bullet', title: 'Bullet list', desc: 'Unordered list', hint: '-', icon: List, keywords: ['ul', 'unordered', 'bullets'], apply: (c) => c.toggleBulletList() },
  { id: 'numbered', title: 'Numbered list', desc: 'Ordered list', hint: '1.', icon: ListOrdered, keywords: ['ol', 'ordered', 'numbers'], apply: (c) => c.toggleOrderedList() },
  { id: 'checklist', title: 'Checklist', desc: 'To-do with checkboxes', hint: '[]', icon: ListChecks, keywords: ['todo', 'task', 'checkbox'], apply: (c) => c.toggleTaskList() },
  { id: 'quote', title: 'Quote', desc: 'Block quote', hint: '>', icon: Quote, keywords: ['blockquote', 'citation'], apply: (c) => c.toggleBlockquote() },
  { id: 'code', title: 'Code block', desc: 'Monospaced code', hint: '```', icon: Code, keywords: ['pre', 'snippet', 'mono'], apply: (c) => c.toggleCodeBlock() },
  { id: 'divider', title: 'Divider', desc: 'Horizontal rule', hint: '---', icon: Minus, keywords: ['hr', 'rule', 'line', 'separator'], apply: (c) => c.setHorizontalRule() },
]

/**
 * Filters blocks by what was typed after `/`, title-prefix matches first.
 * @param blocks - Blocks to filter, in menu order.
 * @param query - Text typed after the slash.
 * @return Matching blocks, best first; every block for an empty query.
 */
export function filterBlocks<T extends Pick<BlockDef, 'title' | 'hint' | 'keywords'>>(blocks: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return blocks
  const rank = (b: T): number => {
    const title = b.title.toLowerCase()
    if (title.startsWith(q) || b.hint === q) return 0
    if (title.split(' ').some((w) => w.startsWith(q))) return 1
    if (b.keywords.some((k) => k.startsWith(q))) return 2
    if (title.includes(q)) return 3
    return -1
  }
  return blocks
    .map((b, i) => ({ b, i, r: rank(b) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.b)
}
