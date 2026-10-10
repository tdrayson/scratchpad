import { call } from '@/lib/api'

const urls = new Map<string, Promise<string | null>>()

/**
 * A displayable URL for a stored image, fetched once and cached for the session.
 * @param id - Image id.
 * @return An object URL, or null if the image is gone.
 */
export function imageUrl(id: string): Promise<string | null> {
  let url = urls.get(id)
  if (!url) {
    url = call('getImage', { id })
      .then((img) => (img ? URL.createObjectURL(new Blob([base64Bytes(img.data)], { type: img.mime })) : null))
      .catch(() => null)
    urls.set(id, url)
  }
  return url
}

/**
 * @param text - Base64 text.
 * @return The decoded bytes.
 */
function base64Bytes(text: string): Uint8Array<ArrayBuffer> {
  const bin = atob(text)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
