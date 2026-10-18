/**
 * URL base de un servicio backend a partir de su variable de entorno. Vacía = mismo origen (proxy de desarrollo).
 * Si tiene valor debe ser un origen `http(s)://host[:puerto][/ruta]`: antes cualquier texto se aceptaba y las llamadas
 * fallaban lejos de la causa. Quita la barra final.
 */
export function resolveBaseUrl(name: string, raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (value === '') return ''
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} no es una URL válida: se esperaba http(s)://host[:puerto]`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${name} debe usar http o https`)
  }
  return value.replace(/\/+$/, '')
}
