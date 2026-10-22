/** Motivo por el que un valor de URL base no es válido. Nunca incluye el valor (puede traer credenciales). */
export type BaseUrlIssue = 'invalid-url' | 'unsupported-protocol'

export type BaseUrlResult = { ok: true; value: string } | { ok: false; issue: BaseUrlIssue }

/**
 * Valida la URL base de un servicio backend sin lanzar. Vacía = mismo origen (proxy de desarrollo).
 * Si tiene valor debe ser un origen `http(s)://host[:puerto][/ruta]`. Devuelve la URL sin la barra final.
 */
export function parseBaseUrl(raw: string | undefined): BaseUrlResult {
  const value = (raw ?? '').trim()
  if (value === '') return { ok: true, value: '' }
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, issue: 'invalid-url' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, issue: 'unsupported-protocol' }
  return { ok: true, value: value.replace(/\/+$/, '') }
}

/**
 * URL base de un servicio backend a partir de su variable de entorno. Lanza si el valor no es válido: antes cualquier texto
 * se aceptaba y las llamadas fallaban lejos de la causa.
 */
export function resolveBaseUrl(name: string, raw: string | undefined): string {
  const result = parseBaseUrl(raw)
  if (result.ok) return result.value
  throw new Error(
    result.issue === 'invalid-url' ? `${name} no es una URL válida: se esperaba http(s)://host[:puerto]` : `${name} debe usar http o https`,
  )
}
