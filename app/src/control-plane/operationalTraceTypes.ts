// INTEROP-2.7 §6.16 — trace operativo de un AnalysisRun (HU15). Distinto del ContextTrace experimental de §6.7.
// Copia fiel del contrato: no añadir campos ni derivar veredictos aquí.

import type { AnalysisSymbolResponse } from './types'

type Id = string

/** `PRESENT` cuando el enlace existe; `NOT_APPLICABLE` solo si el flujo terminó legítimamente antes de ese paso. */
// INTEROP-2.7 §6.16
export type TraceLinkStatus = 'PRESENT' | 'NOT_APPLICABLE'

// INTEROP-2.7 §6.16
export interface TraceExecutionResponse {
  /** Identificador del Sandbox (reutilizado, no creado por Core para la traza). */
  executionId: string
  proposalId: Id
  attempt: number
  executionProfile: string
  /** Clasificación técnica ya expuesta en el Run; se muestra tal cual, sin mapear a veredicto. */
  outcome: string
}

// INTEROP-2.7 §6.16
export interface TraceTargetResponse {
  symbol: AnalysisSymbolResponse
  retrieval: { status: TraceLinkStatus; retrievalId: Id | null }
  context: { status: TraceLinkStatus; contextId: Id | null; functionalRuleIds: Id[] }
  generation: { status: TraceLinkStatus; proposalIds: Id[] }
  executions: { status: TraceLinkStatus; items: TraceExecutionResponse[] }
}

// INTEROP-2.7 §6.16
export interface TracePublicationResponse {
  status: TraceLinkStatus
  checkId: string | null
  companionBranch: string | null
  companionPullRequestUrl: string | null
  sourceHeadSha: string | null
  /** `null` = sin dato; no se interpreta como fallo. */
  freshness: 'CURRENT' | 'STALE' | null
}

// INTEROP-2.7 §6.16
export interface AnalysisRunTraceResponse {
  analysisRunId: Id
  repositoryName: string
  pullRequestNumber: number
  headSha: string
  changeset: { status: TraceLinkStatus; targetCount: number }
  targets: TraceTargetResponse[]
  publication: TracePublicationResponse
}
