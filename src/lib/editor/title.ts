import { Extension } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Keeps the first block an H1 title, and refuses Enter on an empty title so every note gets one.
 * @return The TipTap extension.
 */
export const TitleGuard = Extension.create({
  name: 'titleGuard',

  addKeyboardShortcuts() {
    /**
     * Swallows Enter while the caret is in an empty title.
     * @return True when the key was blocked.
     */
    const block = (): boolean => {
      const { $from } = this.editor.state.selection
      return $from.depth > 0 && $from.index(0) === 0 && $from.parent.content.size === 0
    }
    return { Enter: block, 'Shift-Enter': block, 'Mod-Enter': block }
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
