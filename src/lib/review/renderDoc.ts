import { Check } from '@lucide/vue'
import { h, type VNode, type VNodeChild } from 'vue'
import type { DocNode } from './doc'

const MARKS: Record<string, [string, string?]> = {
  bold: ['strong', 'font-semibold'],
  italic: ['em'],
  strike: ['s'],
  underline: ['u'],
  code: ['code', 'font-mono text-[0.9em] text-accent'],
  link: ['span', 'underline underline-offset-2'],
}

const HEADINGS: Record<number, string> = {
  1: 'text-[20px] font-semibold tracking-[-0.2px]',
  2: 'text-[17px] font-semibold',
  3: 'text-[15px] font-semibold',
}

/**
 * Renders a text node with its marks.
 * @param node - A text node.
 * @return The text wrapped in one element per mark.
 */
function renderText(node: DocNode): VNodeChild {
  return (node.marks ?? []).reduce<VNodeChild>((child, mark) => {
    const [tag, cls] = MARKS[mark.type] ?? ['span']
    return h(tag, { class: cls }, [child])
  }, node.text ?? '')
}

/**
 * Renders a checklist item: the design's box, then the item's content.
 * @param node - A taskItem node.
 * @return The item element.
 */
function renderTask(node: DocNode): VNode {
  const checked = node.attrs?.checked === true
  const box = checked
    ? h('span', { class: 'mt-[3px] flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-secondary text-bg' }, [
        h(Check, { size: 12, strokeWidth: 3, 'aria-hidden': 'true' }),
      ])
    : h('span', { class: 'mt-[3px] size-4 shrink-0 rounded-[4px] border-[1.5px] border-border-strong' })
  return h('li', { class: 'flex items-start gap-3', 'aria-checked': checked, role: 'checkbox', 'aria-readonly': 'true' }, [
    box,
    h('div', { class: ['flex min-w-0 flex-1 flex-col gap-1.5', checked ? 'text-tertiary' : 'text-primary'] }, renderAll(node.content)),
  ])
}

/**
 * Renders one node and its children.
 * @param node - Any document node.
 * @return The rendered element, text, or null for unknown nodes.
 */
function render(node: DocNode): VNodeChild {
  const kids = () => renderAll(node.content)
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'paragraph':
      return h('p', { class: 'm-0' }, kids())
    case 'heading':
      return h(`h${Number(node.attrs?.level ?? 1)}`, { class: ['m-0 text-primary', HEADINGS[Number(node.attrs?.level)] ?? HEADINGS[3]] }, kids())
    case 'bulletList':
      return h('ul', { class: 'm-0 flex list-disc flex-col gap-1 pl-5 marker:text-tertiary' }, kids())
    case 'orderedList':
      return h('ol', { class: 'm-0 flex list-decimal flex-col gap-1 pl-5 marker:text-tertiary', start: node.attrs?.start }, kids())
    case 'listItem':
      return h('li', { class: 'flex flex-col gap-1' }, kids())
    case 'taskList':
      return h('ul', { class: 'm-0 flex list-none flex-col gap-2.5 p-0' }, kids())
    case 'taskItem':
      return renderTask(node)
    case 'blockquote':
      return h('blockquote', { class: 'm-0 flex flex-col gap-1 border-l-2 border-border-strong pl-3 text-secondary' }, kids())
    case 'codeBlock':
      return h('pre', { class: 'm-0 overflow-hidden rounded-md bg-surface px-3 py-2.5 font-mono text-[13px] whitespace-pre-wrap text-primary' }, kids())
    case 'horizontalRule':
      return h('hr', { class: 'm-0 w-full border-0 border-t border-border' })
    case 'hardBreak':
      return h('br')
    default:
      return node.content ? h('div', kids()) : null
  }
}

/**
 * Renders a list of nodes.
 * @param nodes - Child nodes, if any.
 * @return Rendered children.
 */
function renderAll(nodes: DocNode[] | undefined): VNodeChild[] {
  return (nodes ?? []).map(render)
}

/**
 * Renders a note's document read-only, styled like the Review card.
 * @param doc - The document root.
 * @return One element per top-level block.
 */
export function renderDoc(doc: DocNode): VNodeChild[] {
  return renderAll(doc.content)
}
