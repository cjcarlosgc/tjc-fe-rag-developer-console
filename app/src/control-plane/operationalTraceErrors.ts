import { ApiError } from '../api/client'
import { PendingContractError } from '../api/dataSource'

/** INTEROP-2.7 §6.16 / INTEROP-2.2: el trace (y la evidencia) de un Run en `QUEUED`/`PROCESSING` responde `409 EVIDENCE_NOT_FINISHED`. Distinto de `CONTEXT_TRACE_NOT_FINISHED`. */
export function isTraceNotFinished(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409 && error.code === 'EVIDENCE_NOT_FINISHED'
}

/** Reintento del trace: 404/409 y contrato pendiente no se reintentan; el resto conserva dos reintentos. */
export function shouldRetryOperationalTrace(failureCount: number, error: unknown): boolean {
  if (isTraceNotFinished(error) || error instanceof PendingContractError) return false
  if (error instanceof ApiError && error.status === 404) return false
  return failureCount < 2
}
