import type { NoteSummary } from '@/shared/types'

type Groups = Record<'today' | 'week' | 'earlier' | 'stale', NoteSummary[]>

export interface SidebarSection {
  id: keyof Groups
  label: string
  stale: boolean
  /** Right-hand label, e.g. "2 to review". */
  trailing?: string
  notes: NoteSummary[]
}

const LABELS: Record<keyof Groups, string> = { today: 'Today', week: 'This week', earlier: 'Earlier', stale: 'Going stale' }

/**
 * Turns note groups into the sidebar's sections, dropping empty ones.
 * @param groups - Notes per lifecycle group, as useNotes().groups gives them.
 * @return Sections in display order.
 */
export function sidebarSections(groups: Groups): SidebarSection[] {
  return (Object.keys(LABELS) as (keyof Groups)[])
    .filter((id) => groups[id].length)
    .map((id) => ({
      id,
      label: LABELS[id],
      stale: id === 'stale',
      trailing: id === 'stale' ? `${groups.stale.length} to review` : undefined,
      notes: groups[id],
    }))
}
