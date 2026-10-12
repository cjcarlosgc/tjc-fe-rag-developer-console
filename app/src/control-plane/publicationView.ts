/** Devuelve la URL solo si es http/https; cualquier otro protocolo (p. ej. javascript:) no se enlaza. */
export function safePublicationUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}
