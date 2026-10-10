import { describe, expect, it } from 'vitest'
import { isPlainHtml, looksLikeMarkdown } from '@/lib/editor/paste'

describe('looksLikeMarkdown', () => {
  it.each([
    '- milk\n- eggs',
    'Intro\n\n## Section',
    '1. one\n2. two',
    '> quoted',
    '```\ncode\n```',
    '[ ] todo',
    '- [x] done',
  ])('converts %j', (text) => expect(looksLikeMarkdown(text)).toBe(true))

  it.each(['just a sentence', 'price -5 today', '#hashtag', 'a - b'])('leaves %j as text', (text) =>
    expect(looksLikeMarkdown(text)).toBe(false),
  )
})

describe('isPlainHtml', () => {
  it('treats styled paragraphs as plain, so their Markdown text wins', () => {
    expect(isPlainHtml('<p class="p1"><span>- milk</span></p><p>- eggs</p>')).toBe(true)
    expect(isPlainHtml(undefined)).toBe(true)
  })

  it('keeps real structure and the editor’s own copies', () => {
    expect(isPlainHtml('<ul><li>milk</li></ul>')).toBe(false)
    expect(isPlainHtml('<h2>Title</h2>')).toBe(false)
    expect(isPlainHtml('<p data-pm-slice="1 1 []">- x</p>')).toBe(false)
  })
})
