import type { Node as PMNode } from '@tiptap/pm/model'
import type { Plugin } from '@tiptap/pm/state'
import { Editor, type JSONContent } from '@tiptap/vue-3'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import type { Note } from '@/shared/types'
import { createAutosave } from './autosave'
import { clipboardHandlers } from './clipboard'
import { EMPTY_DOC, editorExtensions, toMarkdown } from './extensions'
import type { SlashState } from './slash'

/**
 * The note's stored content as TipTap JSON: its saved doc, else its Markdown, else an empty title.
 * @param editor - Editor whose Markdown parser to use.
 * @param note - The note to load.
 * @return A document for the editor.
 */
function contentOf(editor: Editor, note: Note): JSONContent {
  try {
    const doc = note.doc ? (JSON.parse(note.doc) as JSONContent) : null
    if (doc?.type === 'doc' && doc.content?.length) return doc
  } catch {
    // Unreadable doc JSON: the Markdown copy below is the fallback.
  }
  if (note.markdown.trim() && editor.markdown) return editor.markdown.parse(note.markdown)
  return EMPTY_DOC
}

/**
 * Clears undo history so ⌘Z can't step back into the previously open note.
 * @param editor - The editor.
 */
function resetHistory(editor: Editor): void {
  const history = editor.state.plugins.find((p: Plugin) => (p as unknown as { key: string }).key.startsWith('history$'))
  if (!history) return
  editor.unregisterPlugin('history')
  editor.registerPlugin(history)
}

/**
 * One long-lived TipTap editor bound to the current note: loads it, autosaves it, follows settings.
 * @param slash - Slash-menu state the editor drives.
 * @return The editor, the note's latest Markdown and last-edit time, and focus/flush helpers.
 */
export function useNoteEditor(slash: SlashState) {
  const { current, currentId, save } = useNotes()
  const { settings } = useSettings()

  const editor = shallowRef<Editor>()
  /** Bumps when the editor is rebuilt, to remount its view. */
  const generation = ref(0)
  const markdown = ref('')
  const editedAt = ref(0)
  let loadedId: string | null = null

  const autosave = createAutosave<PMNode>((id, doc) => {
    const ed = editor.value
    if (!ed) return
    const json = doc.toJSON() as JSONContent
    const md = toMarkdown(ed, json)
    if (id === loadedId) markdown.value = md
    void save(id, JSON.stringify(json), md)
  })

  /**
   * ProseMirror props that depend on settings.
   * @return Editor props for the current settings.
   */
  function editorProps() {
    return {
      attributes: { class: 'sp-prose', spellcheck: String(settings.value.spellCheck), 'aria-label': 'Note' },
      handleDOMEvents: clipboardHandlers(() => editor.value),
    }
  }

  /**
   * Builds an editor; input and paste rules follow the Markdown shortcuts setting.
   * @param content - Starting document.
   * @return The editor.
   */
  function build(content: JSONContent): Editor {
    const rules = settings.value.markdownShortcuts
    return new Editor({
      extensions: editorExtensions(slash),
      content,
      enableInputRules: rules,
      enablePasteRules: rules,
      editorProps: editorProps(),
      onUpdate: ({ editor: ed }) => {
        if (!loadedId) return
        editedAt.value = Date.now()
        autosave.schedule(loadedId, ed.state.doc)
      },
    })
  }

  /**
   * Shows a note with a fresh undo history, without emitting an update (so no save).
   * @param note - The note to show.
   */
  function show(note: Note): void {
    const ed = editor.value
    if (!ed) return
    let content = contentOf(ed, note)
    try {
      ed.schema.nodeFromJSON(content).check()
    } catch {
      content = EMPTY_DOC
    }
    ed.chain().setMeta('addToHistory', false).setContent(content, { emitUpdate: false }).run()
    resetHistory(ed)
    loadedId = note.id
    markdown.value = note.markdown
    editedAt.value = note.updatedAt
    if (!note.markdown.trim()) focus()
  }

  /** Puts the caret at the start of the note. */
  function focus(): void {
    editor.value?.commands.focus('start')
  }

  /** Saves pending edits now. */
  function flush(): void {
    autosave.flush()
  }

  /** Saves pending edits when the page is hidden. */
  function onVisibility(): void {
    if (document.visibilityState === 'hidden') flush()
  }

  watch(currentId, flush)
  watch(current, (note) => {
    if (!note) {
      flush()
      loadedId = null
      return
    }
    if (note.id === loadedId) return
    flush()
    show(note)
  })
  watch(
    () => settings.value.spellCheck,
    () => editor.value?.setOptions({ editorProps: editorProps() }),
  )
  watch(
    () => settings.value.markdownShortcuts,
    () => {
      const old = editor.value
      if (!old) return
      flush()
      editor.value = build(old.getJSON())
      generation.value++
      old.destroy()
    },
  )

  onMounted(() => {
    editor.value = build(EMPTY_DOC)
    if (current.value) show(current.value)
    window.addEventListener('blur', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    flush()
    window.removeEventListener('blur', flush)
    window.removeEventListener('beforeunload', flush)
    document.removeEventListener('visibilitychange', onVisibility)
    editor.value?.destroy()
  })

  return { editor, generation, markdown, editedAt, focus, flush }
}
