/** One choice in a Select or SegmentedControl. */
export interface Option<V> {
  value: V
  label: string
  /** Right-aligned muted text in a Select menu, e.g. "16:41". */
  detail?: string
}
