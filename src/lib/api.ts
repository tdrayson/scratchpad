import type { Api } from '../../backend/main'

type Params<K extends keyof Api> = Parameters<Api[K]>[0]
type Result<K extends keyof Api> = Awaited<ReturnType<Api[K]>>

/**
 * Calls a backend api method with typed params and result.
 * @param method - Backend method name.
 * @param params - The method's params.
 * @return The method's result.
 */
export function call<K extends keyof Api>(method: K, ...params: Params<K> extends undefined ? [] : [Params<K>]): Promise<Result<K>> {
  return tiny.api.call(method, params[0] ?? {}) as Promise<Result<K>>
}

/**
 * Subscribes to an event pushed from the backend.
 * @param event - Event name, e.g. 'notes-changed'.
 * @param fn - Handler receiving the event's data.
 * @return Unsubscribe function.
 */
export function on<T = unknown>(event: string, fn: (data: T) => void): () => void {
  return tiny.api.on(event, fn as (data: unknown) => void) as unknown as () => void
}
