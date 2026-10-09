import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { PendingContractError } from '../api/dataSource'
import { isTraceNotFinished } from '../control-plane/operationalTraceErrors'
import { getEvidence } from './api'
import type { EvidenceKind } from './types'

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

export const evidenceRetryDelayMs = (): number => (import.meta.env.MODE === 'test' ? 10 : 900)

export const evidenceKeys = {
  subject: (kind: EvidenceKind, subjectId: string) => ['evidence', kind, subjectId] as const,
}

/**
 * Carga la evidencia solo cuando `enabled` (el sujeto ya está en estado terminal). `gcTime: 0` y `staleTime: 0`
 * evitan retener el bundle, que puede contener fragmentos de código, más tiempo del necesario.
 */
export function useEvidence(kind: EvidenceKind, subjectId: string, enabled: boolean) {
  return useQuery({
    queryKey: evidenceKeys.subject(kind, subjectId),
    queryFn: () => getEvidence(kind, subjectId),
    enabled: enabled && Boolean(subjectId),
    retry: shouldRetryEvidence,
    retryDelay: evidenceRetryDelayMs,
    staleTime: 0,
    gcTime: 0,
  })
}
