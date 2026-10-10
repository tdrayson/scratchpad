import { mergeAttributes, Node, VueNodeViewRenderer, type Editor } from '@tiptap/vue-3'
import ImageView from '@/components/editor/ImageView.vue'
import { IMAGE_SCHEME } from '@/shared/images'

export interface ImageOptions {
  /** Opens a file picker and inserts the chosen images; set by the note editor. */
  pick?: () => void
}

/**
 * An image in the note. Stored images carry an `id`; links to anything else keep their `src` but aren't loaded,
 * so a pasted web image never makes a network request.
 */
export const ImageNode = Node.create<ImageOptions>({
  name: 'image',
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,

  addOptions() {
    return { pick: undefined }
  },

  addAttributes() {
    return {
      id: { default: null, parseHTML: (el) => el.getAttribute('data-image-id') },
      src: { default: null, parseHTML: (el) => (el.hasAttribute('data-image-id') ? null : el.getAttribute('src')) },
      alt: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'img[data-image-id]' }, { tag: 'img[src]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { id, src, alt } = node.attrs
    return ['img', mergeAttributes(HTMLAttributes, id ? { 'data-image-id': id, alt, src: null } : { src, alt })]
  },

  markdownTokenName: 'image',

  parseMarkdown: (token, h) => {
    const href = String(token.href ?? '')
    const stored = href.startsWith(IMAGE_SCHEME)
    return h.createNode('image', {
      id: stored ? href.slice(IMAGE_SCHEME.length) : null,
      src: stored ? null : href,
      alt: token.text ?? '',
    })
  },

  renderMarkdown: (node) => {
    const { id, src, alt } = node.attrs ?? {}
    return `![${String(alt ?? '').replace(/[[\]]/g, '')}](${id ? IMAGE_SCHEME + id : (src ?? '')})`
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageView)
  },
})

/**
 * Opens the image picker configured on the editor's image node.
 * @param editor - The editor.
 * @return True, so it can end a command chain.
 */
export function pickImage(editor: Pick<Editor, 'extensionManager'>): boolean {
  const ext = editor.extensionManager.extensions.find((e) => e.name === ImageNode.name)
  ;(ext?.options as ImageOptions | undefined)?.pick?.()
  return true
}
