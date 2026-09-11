import type { FailureType } from '../runs/types'

export type ExperimentStrategy = 'RAG' | 'GENERALIST_AGENT'
export interface StrategyMetrics {
  strategy: ExperimentStrategy
  validRate: number
  compilationRate: number
  executionRate: number
  passedRate: number
  totalDurationMs: number
  totalTokens: number | null
  estimatedCost: number | null
  failures: Partial<Record<FailureType, number>>
  retrievedChunks?: number | null
  selectedChunks?: number | null
  contextTokens?: number | null
  toolCalls?: number | null
  filesInspected?: number | null
}
export interface RepetitionResult { target: string; repetition: 1 | 2 | 3; strategy: ExperimentStrategy; valid: boolean; failureType: FailureType; durationMs: number; totalTokens: number | null; errorSummary: string | null }
/** `baseline` es la clave interna del agente generalista (rol de comparación), nunca un valor de contrato: `GENERALIST_AGENT` es lo único que viaja por HTTP. */
export interface ExperimentResultViewModel { baseline: StrategyMetrics; rag: StrategyMetrics; repetitions: RepetitionResult[] }

export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export interface ExperimentAccepted { experimentId: string; status: 'PENDING'; pollAfterMs: number }
export interface ExperimentOperation { id: string; status: ExperimentStatus; progress: number; result?: ExperimentResultViewModel }
