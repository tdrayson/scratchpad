import type { Node as PMNode } from '@tiptap/pm/model'
import type { Plugin } from '@tiptap/pm/state'
import { Editor, type JSONContent } from '@tiptap/vue-3'
import type { EditorView } from '@tiptap/pm/view'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useNotes } from '@/composables/useNotes'
import { useSettings } from '@/composables/useSettings'
import { useView } from '@/composables/useView'
import { call } from '@/lib/api'
import type { Note } from '@/shared/types'
import { createAutosave } from './autosave'
import { clipboardHandlers } from './clipboard'
import { EMPTY_DOC, editorExtensions, fromMarkdown, toMarkdown } from './extensions'
import { hasImagePath, imageFiles, insertImages, PICKER_TYPES, storeFiles } from './imageInsert'
import { isPlainHtml, looksLikeMarkdown } from './paste'
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
  if (note.markdown.trim() && editor.markdown) return fromMarkdown(editor, note.markdown)
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
  const { showToast } = useView()

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
    return save(id, JSON.stringify(json), md)
  })

  /**
   * Inserts stored images and reports any that were skipped.
   * @param stored - Ids stored, and how many files were skipped.
   */
  function placeImages(stored: { ids: string[]; skipped: number }): void {
    if (editor.value) insertImages(editor.value, stored.ids)
    if (stored.skipped) showToast('Images must be PNG, JPEG, GIF, WebP or HEIC, under 10 MB')
  }

  /**
   * Stores image files from disk in the open note and inserts them.
   * @param paths - Absolute file paths.
   */
  async function addImagePaths(paths: string[]): Promise<void> {
    if (!loadedId || !paths.length) return
    try {
      placeImages(await call('addImageFiles', { noteId: loadedId, paths }))
    } catch {
      showToast("Couldn't add that image")
    }
  }

  /**
   * Stores pasted or dropped image files in the open note and inserts them.
   * @param files - Image files.
   */
  async function addImageFiles(files: File[]): Promise<void> {
    if (!loadedId) return
    try {
      placeImages(await storeFiles(loadedId, files))
    } catch {
      showToast("Couldn't add that image")
    }
  }

  /** Opens a file picker for the `/image` block. */
  async function pickImages(): Promise<void> {
    const paths = await tiny.dialog.openFiles({ types: PICKER_TYPES })
    if (paths) await addImagePaths(paths)
  }

  /**
   * Images become stored images; Markdown text (even under TextEdit-style HTML) becomes real blocks.
   * @param _view - The editor view.
   * @param e - The paste event.
   * @return True when handled here.
   */
  function handlePaste(_view: EditorView, e: ClipboardEvent): boolean {
    const data = e.clipboardData
    const files = imageFiles(data)
    if (files.length) {
      void addImageFiles(files)
      return true
    }
    if (data?.types.includes('Files')) {
      void tiny.clipboard.read().then((clip) => {
        const paths = clip.kind === 'image' && clip.image ? [clip.image] : clip.paths
        if (hasImagePath(paths)) void addImagePaths(paths)
        else if (clip.text) editor.value?.commands.insertContent(clip.text)
      })
      return true
    }
    const text = data?.getData('text/plain') ?? ''
    const ed = editor.value
    if (!ed?.markdown || !settings.value.markdownShortcuts || !looksLikeMarkdown(text)) return false
    if (!isPlainHtml(data?.getData('text/html'))) return false
    ed.commands.insertContent(fromMarkdown(ed, text).content ?? [])
    return true
  }

  /**
   * Image files dragged in from a web page or another app become stored images.
   * @param _view - The editor view.
   * @param e - The drop event.
   * @return True when handled here.
   */
  function handleDrop(_view: EditorView, e: DragEvent): boolean {
    const files = imageFiles(e.dataTransfer)
    if (!files.length) return false
    void addImageFiles(files)
    return true
  }

  /**
   * ProseMirror props that depend on settings.
   * @return Editor props for the current settings.
   */
  function editorProps() {
    return {
      attributes: { class: 'sp-prose', spellcheck: String(settings.value.spellCheck), 'aria-label': 'Note' },
      handleDOMEvents: clipboardHandlers(() => editor.value),
      handlePaste,
      handleDrop,
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
      extensions: editorExtensions(slash, true, { pick: () => void pickImages() }),
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

  /**
   * Saves pending edits now.
   * @return Resolves once the save has reached the backend.
   */
  function flush(): Promise<void> {
    return autosave.flush()
  }

  /** Saves pending edits when the page is hidden. */
  function onVisibility(): void {
    if (document.visibilityState === 'hidden') void flush()
  }

  watch(currentId, flush)
  watch(current, (note) => {
    if (!note) {
      void flush()
      loadedId = null
      return
    }
    if (note.id === loadedId) return
    void flush()
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
      void flush()
      editor.value = build(old.getJSON())
      generation.value++
      old.destroy()
    },
  )

  // Finder drops arrive as paths from the window, not as DOM drop events.
  useFileDrop((paths) => void addImagePaths(paths.filter((p) => hasImagePath([p]))))

  onMounted(() => {
    editor.value = build(EMPTY_DOC)
    if (current.value) show(current.value)
    window.addEventListener('blur', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    void flush()
    window.removeEventListener('blur', flush)
    window.removeEventListener('beforeunload', flush)
    document.removeEventListener('visibilitychange', onVisibility)
    editor.value?.destroy()
  })

  return { editor, generation, markdown, editedAt, focus, flush }
}
