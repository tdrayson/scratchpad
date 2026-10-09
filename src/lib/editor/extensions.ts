import type { AnyExtension, Editor, JSONContent } from '@tiptap/vue-3'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { SlashCommand, type SlashState } from './slash'
import { TitleGuard } from './title'

/**
 * The editor's extensions: rich blocks, nested checklists, a required H1 title, Markdown I/O and, optionally, the `/` menu.
 * @param slash - Slash-menu state to drive; omit for a headless editor (tests, conversion).
 * @param title - Enforce the H1 title rule; off for headless conversion.
 * @return Extensions for a TipTap editor.
 */
export function editorExtensions(slash?: SlashState, title = Boolean(slash)): AnyExtension[] {
  const list: AnyExtension[] = [
    StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: ({ node, pos }) => (pos === 0 && node.type.name === 'heading' ? 'Title' : ''),
    }),
    Markdown,
  ]
  if (title) list.push(TitleGuard)
  if (slash) list.push(SlashCommand(slash))
  return list
}

/** Content for a brand-new note: an empty title line. */
export const EMPTY_DOC = { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 } }] }

/**
 * Serialises a document to Markdown without the trailing blank lines the trailing empty paragraph leaves.
 * @param editor - Editor whose Markdown manager to use.
 * @param json - Document to serialise; defaults to the editor's own.
 * @return The Markdown.
 */
export function toMarkdown(editor: Editor, json: JSONContent = editor.getJSON()): string {
  return (editor.markdown?.serialize(json) ?? editor.getText()).trimEnd()
}
