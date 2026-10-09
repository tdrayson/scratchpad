import { describe, expect, it } from 'vitest'
import { visibleText } from '@/shared/text'

describe('visibleText', () => {
  it('drops invisible characters and entities', () => {
    expect(visibleText('&nbsp;')).toBe('')
    expect(visibleText('a&nbsp;&nbsp;b')).toBe('a b')
    expect(visibleText(' ​')).toBe('')
  })

  it('decodes common entities', () => {
    expect(visibleText('Tom &amp; Jerry &lt;3 &#8212; ok')).toBe('Tom & Jerry <3 — ok')
  })
})
