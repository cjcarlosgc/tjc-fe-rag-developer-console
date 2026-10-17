/** Copia sin lanzar: sin `navigator.clipboard` o si el navegador rechaza la escritura devuelve `false`. */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
