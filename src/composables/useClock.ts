import { ref } from 'vue'

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

/**
 * A shared clock that ticks every 30 seconds, for ages and theme switching.
 * @return The current time in epoch ms, and a function to refresh it immediately.
 */
export function useClock() {
  timer ??= setInterval(() => (now.value = Date.now()), 30_000)
  return { now, tick: () => (now.value = Date.now()) }
}
