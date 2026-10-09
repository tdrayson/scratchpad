import { describe, expect, it } from 'vitest'
import { sidebarSections } from '@/lib/sidebar/sections'
import type { NoteSummary } from '@/shared/types'

const n = (id: string) => ({ id }) as NoteSummary

describe('sidebarSections', () => {
  it('keeps order, drops empty groups and counts stale notes', () => {
    const sections = sidebarSections({ today: [n('a')], week: [], earlier: [n('b')], stale: [n('c'), n('d')] })
    expect(sections.map((s) => s.label)).toEqual(['Today', 'Earlier', 'Going stale'])
    expect(sections[2]).toMatchObject({ stale: true, trailing: '2 to review' })
    expect(sections[0].trailing).toBeUndefined()
  })
})
