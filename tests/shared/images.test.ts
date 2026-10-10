import { describe, expect, it } from 'vitest'
import { extensionFor, imageIds, mimeForPath, rewriteImageLinks, stripImages } from '@/shared/images'

const md =
  '# Trip\n\n![map](scratchpad-image:a1) and ![](scratchpad-image:b2)\n\n![logo](https://x.com/l.png) ![again](scratchpad-image:a1)'

describe('images', () => {
  it('finds stored image ids once each, ignoring other links', () => {
    expect(imageIds(md)).toEqual(['a1', 'b2'])
  })

  it('rewrites only the links the mapper returns a value for', () => {
    const out = rewriteImageLinks(md, (src) =>
      src.startsWith('scratchpad-image:') ? `images/${src.slice(17)}.png` : null,
    )
    expect(out).toContain('![map](images/a1.png)')
    expect(out).toContain('![logo](https://x.com/l.png)')
  })

  it('reads angle-bracketed paths with spaces from other apps', () => {
    expect(rewriteImageLinks('![x](<images/a b.png> "Title")', (src) => src.replace('images/', 'pics/'))).toBe(
      '![x](<pics/a b.png>)',
    )
  })

  it('strips images from text', () => {
    expect(stripImages('See ![map](scratchpad-image:a1) here')).toBe('See  here')
  })

  it('maps extensions and MIME types both ways', () => {
    expect(mimeForPath('Shot.JPG')).toBe('image/jpeg')
    expect(mimeForPath('notes.md')).toBeNull()
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/unknown')).toBe('png')
  })
})
