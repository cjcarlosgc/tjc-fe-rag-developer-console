export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1_000) return `${milliseconds} ms`
  const seconds = Math.round(milliseconds / 1_000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'percent', maximumFractionDigits: 0 }).format(Math.min(1, Math.max(0, value)))
}

export function formatEstimatedCost(value: number, currency = 'USD'): string {
  return `${new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 4 }).format(value)} estimado`
}
