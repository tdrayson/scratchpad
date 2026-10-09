/** A ProseMirror/TipTap JSON node, as stored in `notes.doc`. */
export interface DocNode {
  type: string
  attrs?: Record<string, unknown>
  content?: DocNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

/**
 * Reads a note's stored document, falling back to its Markdown when there's no valid JSON.
 * @param doc - Serialised TipTap JSON, possibly empty.
 * @param markdown - The note as Markdown.
 * @return A document node.
 */
export function parseDoc(doc: string, markdown: string): DocNode {
  try {
    const parsed = JSON.parse(doc) as DocNode
    if (parsed?.type === 'doc') return parsed
  } catch {
    // Not JSON: notes created from plain text have Markdown only.
  }
  return markdownToDoc(markdown)
}

const text = (s: string): DocNode[] => (s ? [{ type: 'text', text: s }] : [])
const para = (s: string): DocNode => ({ type: 'paragraph', content: text(s) })

type LineRule = { re: RegExp; list: string; item: (m: RegExpExecArray) => DocNode }

const LIST_RULES: LineRule[] = [
  {
    re: /^\s*[-*+] \[( |x|X)\] (.*)$/,
    list: 'taskList',
    item: (m) => ({ type: 'taskItem', attrs: { checked: m[1] !== ' ' }, content: [para(m[2])] }),
  },
  { re: /^\s*[-*+] (.*)$/, list: 'bulletList', item: (m) => ({ type: 'listItem', content: [para(m[1])] }) },
  { re: /^\s*\d+[.)] (.*)$/, list: 'orderedList', item: (m) => ({ type: 'listItem', content: [para(m[1])] }) },
]

/**
 * Minimal block-level Markdown reader for the preview: headings, lists, checklists, quotes, code, rules.
 * @param md - Markdown text.
 * @return A document node.
 */
export function markdownToDoc(md: string): DocNode {
  const out: DocNode[] = []
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    if (line.startsWith('```')) {
      const body: string[] = []
      while (++i < lines.length && !lines[i].startsWith('```')) body.push(lines[i])
      out.push({ type: 'codeBlock', content: text(body.join('\n')) })
      continue
    }
    const h = /^(#{1,3}) (.*)$/.exec(line)
    if (h) {
      out.push({ type: 'heading', attrs: { level: h[1].length }, content: text(h[2]) })
      continue
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      out.push({ type: 'horizontalRule' })
      continue
    }
    if (line.startsWith('>')) {
      out.push({ type: 'blockquote', content: [para(line.replace(/^>\s?/, ''))] })
      continue
    }
    const rule = LIST_RULES.find((r) => r.re.test(line))
    if (rule) {
      const last = out[out.length - 1]
      const list = last?.type === rule.list ? last : { type: rule.list, content: [] as DocNode[] }
      if (list !== last) out.push(list)
      list.content!.push(rule.item(rule.re.exec(line)!))
      continue
    }
    out.push(para(line))
  }
  return { type: 'doc', content: out }
}
