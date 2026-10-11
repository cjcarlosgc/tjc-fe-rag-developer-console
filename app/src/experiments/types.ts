export type ExperimentStrategy = 'RAG' | 'GENERALIST_AGENT'
export type FailureType = 'NONE' | 'COMPILATION' | 'TEST_ASSERTION' | 'TEST_RUNTIME' | 'DEPENDENCY' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'UNKNOWN'
/**
 * INTEROP-2.7 §6.5.1 (`DEC-EVID-001`, CS-CORE-20261009-015): tasas y duraciones son `number | null`.
 * `null` = sin datos evaluables (nunca se formatea como 0 %, 0 ms ni «null ms»). Un `0` es cero real.
 */
export interface StrategyMetrics {
  strategy: ExperimentStrategy
  validRate: number | null
  compilationRate: number | null
  executionRate: number | null
  passedRate: number | null
  generationDurationMs: number | null
  executionDurationMs: number | null
  totalDurationMs: number | null
  totalTokens: number | null
  estimatedCost: number | null
  failures: Partial<Record<FailureType, number>>
  retrievedChunks?: number | null
  selectedChunks?: number | null
  contextTokens?: number | null
  toolCalls?: number | null
  filesInspected?: number | null
  /** Respuestas previas a CS-CORE-20261009-015 no los traen: `undefined` = no informado. */
  evaluableRepetitions?: number
  nonEvaluableRepetitions?: number
}
export interface RepetitionResult {
  target: string
  repetition: 1 | 2 | 3
  strategy: ExperimentStrategy
  valid: boolean
  failureType: FailureType
  /** Generación (LLM). `null` = no observado. */
  generationDurationMs: number | null
  /** Llamada al Sandbox. `null` = el Sandbox nunca se invocó (o corrida previa a OE5); `0` no significa «sin ejecutar». */
  executionDurationMs: number | null
  totalDurationMs: number | null
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
/** Configuración común a ambos brazos (INTEROP-2.7 §6.5.1). Solo se muestra; Console no declara ganador. Cada campo puede faltar por separado. */
export interface ExperimentConfiguration {
  model: {
    provider: string | null
    model: string | null
    modelVersion: string | null
    reasoningEffort: string | null
    temperature: number | null
    maxOutputTokens: number | null
  } | null
  budget: {
    toolCallCap: number | null
    contextTokenBudget: number | null
    maxDurationMs: number | null
  } | null
  executionProfile: string | null
  /** Tipado y mapeado; no se muestra (sin semántica publicada). */
  runnerHint: string | null
  randomizationSeed: string | null
}
/** `baseline` es la clave interna del agente generalista (rol de comparación), nunca un valor de contrato: `GENERALIST_AGENT` es lo único que viaja por HTTP. */
/** `configuration` undefined/null = «no disponible». */
export interface ExperimentResultViewModel { baseline: StrategyMetrics; rag: StrategyMetrics; repetitions: RepetitionResult[]; configuration?: ExperimentConfiguration | null }

export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export interface ExperimentAccepted { analysisRunId: string; experimentId: string; projectVersionId: string; status: 'PENDING'; pollAfterMs: number }
export interface ExperimentOperation {
  id: string
  status: ExperimentStatus
  progress: number
  result?: ExperimentResultViewModel
  configuration?: ExperimentConfiguration | null
  /** Cadena abierta (CS-CORE-20261009-010): `EXPERIMENT_FAILED`, `EXPERIMENT_WORKER_LOST` u otro valor desconocido. */
  failureCode: string | null
  failureMessage: string | null
}
