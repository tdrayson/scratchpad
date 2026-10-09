import { getHTMLFromFragment, type Editor } from '@tiptap/vue-3'
import { toMarkdown } from './extensions'

/**
 * The editor's selection as Markdown text and HTML.
 * @param editor - The editor.
 * @return Text and HTML, or null when nothing is selected.
 */
export function selectionData(editor: Editor): { text: string; html: string } | null {
  const { selection, schema } = editor.state
  if (selection.empty) return null
  const fragment = selection.content().content
  const json = { type: 'doc', content: fragment.toJSON() ?? [] }
  return { text: toMarkdown(editor, json), html: getHTMLFromFragment(fragment, schema) }
}

/**
 * Writes to the system clipboard through tinyjs, falling back to the event's clipboard.
 * @param data - Text and optional HTML.
 * @param e - The copy/cut event, used when tiny is unavailable.
 */
export function writeClipboard(data: { text: string; html?: string }, e?: ClipboardEvent): void {
  if (typeof tiny !== 'undefined' && tiny.clipboard) {
    void tiny.clipboard.write(data)
    return
  }
  e?.clipboardData?.setData('text/plain', data.text)
  if (data.html) e?.clipboardData?.setData('text/html', data.html)
}

/**
 * ProseMirror DOM handlers so ⌘C/⌘X put Markdown text and HTML on the clipboard.
 * @param getEditor - Returns the live editor.
 * @return `copy` and `cut` handlers for `editorProps.handleDOMEvents`.
 */
export function clipboardHandlers(getEditor: () => Editor | undefined) {
  /**
   * Copies, and for cut also deletes, the selection.
   * @param e - The clipboard event.
   * @param cut - Whether to delete the selection afterwards.
   * @return True when handled.
   */
  function handle(e: ClipboardEvent, cut: boolean): boolean {
    const editor = getEditor()
    const data = editor && selectionData(editor)
    if (!editor || !data) return false
    e.preventDefault()
    writeClipboard(data, e)
    if (cut) editor.view.dispatch(editor.state.tr.deleteSelection().scrollIntoView().setMeta('uiEvent', 'cut'))
    return true
  }

  return {
    copy: (_view: unknown, e: Event) => handle(e as ClipboardEvent, false),
    cut: (_view: unknown, e: Event) => handle(e as ClipboardEvent, true),
  }
}
