import { Extension } from '@tiptap/vue-3'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion'
import { reactive } from 'vue'
import { BLOCKS, filterBlocks, type BlockDef } from './blocks'

export interface SlashState {
  open: boolean
  query: string
  items: BlockDef[]
  index: number
  /** Viewport rect of the typed `/query`, for placing the menu. */
  rect: { top: number; bottom: number; left: number; right: number } | null
  /** Applies a block in place of the typed `/query`. */
  choose: (block: BlockDef) => void
}

/**
 * Fresh, closed slash-menu state for the menu component to render.
 * @return Reactive slash-menu state.
 */
export function createSlashState(): SlashState {
  return reactive({ open: false, query: '', items: [], index: 0, rect: null, choose: () => {} })
}

/**
 * The `/` block menu: tracks the typed query into `state`, handles ↑ ↓ ↵ while open.
 * @param state - Shared state the menu component renders.
 * @return The TipTap extension.
 */
export function SlashCommand(state: SlashState) {
  /**
   * Copies suggestion props into the shared state.
   * @param props - Current suggestion props.
   */
  function sync(props: SuggestionProps<BlockDef, BlockDef>): void {
    const r = props.clientRect?.()
    if (state.query !== props.query) state.index = 0
    state.query = props.query
    state.items = props.items
    state.index = Math.min(state.index, Math.max(0, props.items.length - 1))
    state.rect = r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null
    state.choose = (block) => props.command(block)
    state.open = true
  }

  /**
   * Arrow and Enter handling while the menu is open.
   * @param props - The keydown props.
   * @return True when the key was handled.
   */
  function onKeyDown({ event }: SuggestionKeyDownProps): boolean {
    const n = state.items.length
    if (!state.open || !n || event.isComposing) return false
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      state.index = (state.index + (event.key === 'ArrowDown' ? 1 : -1) + n) % n
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const block = state.items[state.index]
      if (block) state.choose(block)
      return true
    }
    return false
  }

  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<BlockDef, BlockDef>({
          pluginKey: new PluginKey('slashCommand'),
          editor: this.editor,
          char: '/',
          allow: ({ state: s, range }) => !s.doc.resolve(range.from).parent.type.spec.code,
          items: ({ query }) => filterBlocks(BLOCKS, query),
          command: ({ editor, range, props }) => {
            props.apply(editor.chain().focus().deleteRange(range)).run()
          },
          render: () => ({
            onStart: sync,
            onUpdate: sync,
            onKeyDown,
            onExit: () => {
              state.open = false
              state.rect = null
            },
          }),
        }),
      ]
    },
  })
}
