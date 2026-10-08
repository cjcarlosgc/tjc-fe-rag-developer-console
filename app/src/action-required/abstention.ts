import { formatDate } from '../formatting'
import type { FunctionalAbstentionSummary } from './types'

/**
 * INTEROP-2.7 §6.11: línea de abstención visible en Focus Mode y Action Required.
 * No incluye `lastByUserId`: la UI muestra el rol y la fecha, nunca la identidad de quien se abstuvo.
 */
export function abstentionLabel(abstention: FunctionalAbstentionSummary): string {
  const when = Number.isNaN(new Date(abstention.lastAt).getTime()) ? abstention.lastAt : formatDate(abstention.lastAt)
  return `Abstención registrada · ${abstention.lastByRole} · ${when} · ${abstention.count} abstención(es)`
}
