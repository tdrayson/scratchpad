import { Extension } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Keeps the first block an H1 title, refuses Enter on an empty title so every note gets one,
 * and scopes ⌘A to the title or the body, whichever holds the caret.
 * @return The TipTap extension.
 */
export const TitleGuard = Extension.create({
  name: 'titleGuard',
  priority: 1000,

  addKeyboardShortcuts() {
    /**
     * Swallows Enter while the caret is in an empty title.
     * @return True when the key was blocked.
     */
    const block = (): boolean => {
      const { $from } = this.editor.state.selection
      return $from.depth > 0 && $from.index(0) === 0 && $from.parent.content.size === 0
    }
    /**
     * Selects the title's text when the caret is in it, otherwise everything after the title.
     * @return True, so the editor's own select-all never runs.
     */
    const selectAll = (): boolean => {
      const { state } = this.editor
      const title = state.doc.firstChild
      if (!title) return false
      const inTitle = state.selection.$from.index(0) === 0
      const from = inTitle ? 1 : title.nodeSize
      const to = inTitle ? title.nodeSize - 1 : state.doc.content.size
      return this.editor.commands.setTextSelection({ from, to: Math.max(from, to) })
    }
    return { Enter: block, 'Shift-Enter': block, 'Mod-Enter': block, 'Mod-a': selectAll }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('titleGuard'),
        appendTransaction: (_trs, _old, state) => {
          const first = state.doc.firstChild
          if (!first || (first.type.name === 'heading' && first.attrs.level === 1)) return null
          const heading = state.schema.nodes.heading
          if (!first.isTextblock || !heading) return null
          return state.tr.setNodeMarkup(0, heading, { level: 1 })
        },
      }),
    ]
  },
})
