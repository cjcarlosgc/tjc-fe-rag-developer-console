import type { AnalysisSymbolResponse } from '../control-plane/types'
import type { ExperimentResultViewModel } from '../experiments/types'

/**
 * INTEROP-2.1 §6.5 (HU48) — **definido, pendiente de implementación en Core**
 * (contrato ratificado 2026-09-15, ver `spec/contracts/interoperability-contract.md`
 * y `harness/reports/console-backlog-formalization.md`). `CreateExperimentRequest`
 * reapunta de `projectId`/`targetId` a `analysisRunId`+símbolo: el símbolo debe ser
 * `DIRECTLY_CHANGED` y `METHOD`/`FUNCTION` (404/422 si no). No hay adapter live
 * todavía — `run-comparison/api.ts` rechaza con `PendingContractError` en modo live.
 */
export type RunComparisonStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface RunComparisonAccepted {
  analysisRunId: string
  comparisonId: string
  projectVersionId: string
  status: 'PENDING'
  pollAfterMs: number
}

export interface RunComparisonOperation {
  id: string
  analysisRunId: string
  projectId: string
  projectVersionId: string
  symbol: AnalysisSymbolResponse
  status: RunComparisonStatus
  progress: number
  result?: ExperimentResultViewModel
}

/** Único símbolo elegible por contrato: `DIRECTLY_CHANGED` y de tipo `METHOD`/`FUNCTION`. */
export function findEligibleSymbol(symbols: AnalysisSymbolResponse[]): AnalysisSymbolResponse | null {
  return symbols.find((symbol) => symbol.changeKind === 'DIRECTLY_CHANGED' && (symbol.kind === 'METHOD' || symbol.kind === 'FUNCTION')) ?? null
}
