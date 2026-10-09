export type ExperimentStrategy = 'RAG' | 'GENERALIST_AGENT'
export type FailureType = 'NONE' | 'COMPILATION' | 'TEST_ASSERTION' | 'TEST_RUNTIME' | 'DEPENDENCY' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'UNKNOWN'
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
export interface RepetitionResult {
  target: string
  repetition: 1 | 2 | 3
  strategy: ExperimentStrategy
  valid: boolean
  failureType: FailureType
  durationMs: number
  totalTokens: number | null
  errorSummary: string | null
  /** INTEROP-2.7 §6.5.1: par RAG/GA de la misma repetición. Opaco; no inferir numeración. */
  pairId: string | null
  /** Posición de ejecución dentro del par (reproducible desde randomizationSeed). */
  pairPosition: 1 | 2 | null
  /** 1 o 2 (máximo un reintento por fallo externo demostrado). */
  attempt: number | null
  /** `false` = segundo fallo de infraestructura; la fila se marca como no evaluable técnicamente. */
  technicallyEvaluable: boolean | null
}
/** Configuración común a ambos brazos (INTEROP-2.7 §6.5.1). Solo se muestra; Console no declara ganador. */
export interface ExperimentConfiguration {
  model: {
    provider: string
    model: string
    modelVersion: string | null
    reasoningEffort: string | null
    temperature: number | null
    maxOutputTokens: number | null
  }
  budget: {
    toolCallCap: number
    contextTokenBudget: number
    maxDurationMs: number
  }
  executionProfile: string
  /** Tipado y mapeado; no se muestra (sin semántica publicada). */
  runnerHint: string
  randomizationSeed: string
}
/** `baseline` es la clave interna del agente generalista (rol de comparación), nunca un valor de contrato: `GENERALIST_AGENT` es lo único que viaja por HTTP. */
/** `configuration` undefined/null = «no disponible». */
export interface ExperimentResultViewModel { baseline: StrategyMetrics; rag: StrategyMetrics; repetitions: RepetitionResult[]; configuration?: ExperimentConfiguration | null }

export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export interface ExperimentAccepted { experimentId: string; status: 'PENDING'; pollAfterMs: number }
export interface ExperimentOperation { id: string; status: ExperimentStatus; progress: number; result?: ExperimentResultViewModel; configuration?: ExperimentConfiguration | null }
