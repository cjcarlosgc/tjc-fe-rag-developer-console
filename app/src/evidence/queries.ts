import { ApiError } from '../api/client'
import { PendingContractError } from '../api/dataSource'
import { isTraceNotFinished } from '../control-plane/operationalTraceErrors'
import { pollDelayMs } from '../api/polling'

/** Reintentos del 409 `EVIDENCE_NOT_FINISHED` antes de dar el estado por «todavía no»; el usuario puede reintentar a mano. */
export const EVIDENCE_NOT_FINISHED_MAX_RETRIES = 30

/**
 * Solo el 409 `EVIDENCE_NOT_FINISHED` se reintenta, de forma acotada. 404, 403, el contrato pendiente y cualquier
 * otro error se propagan sin reintento: un 409 no es un fallo.
 */
export function shouldRetryEvidence(failureCount: number, error: unknown): boolean {
  if (error instanceof PendingContractError) return false
  if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return false
  return isTraceNotFinished(error) && failureCount < EVIDENCE_NOT_FINISHED_MAX_RETRIES
}

export const evidenceRetryDelayMs = (): number => pollDelayMs()
