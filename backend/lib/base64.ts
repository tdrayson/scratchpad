// txiki ships the ES2026 Uint8Array base64 methods; the TypeScript lib in use doesn't declare them yet.
type Base64Bytes = Uint8Array & { toBase64(): string }
const Bytes = Uint8Array as unknown as { fromBase64(text: string): Uint8Array }

/**
 * @param text - Base64 text.
 * @return The decoded bytes.
 */
export const fromBase64 = (text: string): Uint8Array => Bytes.fromBase64(text)

/**
 * @param bytes - Bytes to encode.
 * @return Base64 text.
 */
export const toBase64 = (bytes: Uint8Array): string => (bytes as Base64Bytes).toBase64()
