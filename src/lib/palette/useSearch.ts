import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { call } from '@/lib/api'
import type { SearchHit } from '@/shared/types'

export const SEARCH_DEBOUNCE = 80

/**
 * Debounced backend search that follows a query, ignoring responses that arrive out of order.
 * @param query - The live query text.
 * @return The latest hits for the current query.
 */
export function useSearch(query: Ref<string>) {
  const hits = ref<SearchHit[]>([])
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  watch(
    query,
    (q) => {
      clearTimeout(timer)
      const mine = ++seq
      if (!q.trim()) return void (hits.value = [])
      timer = setTimeout(async () => {
        const result = await call('search', { query: q })
        if (mine === seq) hits.value = result
      }, SEARCH_DEBOUNCE)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => clearTimeout(timer))

  return { hits }
}
