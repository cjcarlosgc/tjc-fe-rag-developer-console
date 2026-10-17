/** Evita open-redirect: solo se acepta una ruta interna como destino tras el login. */
export function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}
