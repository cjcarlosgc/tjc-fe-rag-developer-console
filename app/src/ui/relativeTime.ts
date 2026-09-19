/** Formato compacto tipo "hace 8 min" para timestamps ISO; `now` es inyectable para tests deterministas. */
export function formatRelativeAge(iso: string, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - new Date(iso).getTime())
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'justo ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}
