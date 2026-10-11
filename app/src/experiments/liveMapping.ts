import type { ExperimentConfiguration, ExperimentOperation, ExperimentResultViewModel, ExperimentStrategy, FailureType, StrategyMetrics } from './types'

/**
 * `ExperimentResultsResponse` (INTEROP-1.5) trae `strategies: StrategyMetricsResponse[]` (RAG +
 * GENERALIST_AGENT) y `repetitions` sin campo `target` (una sola pieza por experimento). Este
 * módulo lo combina con `ExperimentStatusResponse` en el mismo `{baseline, rag}` view model que
 * ya consume `ExperimentComparison`.
 */

export interface ExperimentStatusResponse {
  id: string
  analysisRunId: string
  projectId: string
  projectVersionId: string
  symbol: import('../control-plane/types').AnalysisSymbolResponse
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  completedRepetitions: number
  totalRepetitions: number
  failureCode: string | null
  failureMessage: string | null
  startedAt: string | null
  completedAt: string | null
  /** INTEROP-2.7 §6.5.1, opcionales y nullables: corridas previas a OE5 los emiten en `null` o no los envían. */
  model?: ExperimentModelConfigResponse | null
  budget?: ExperimentBudgetResponse | null
  executionProfile?: string | null
  runnerHint?: string | null
  randomizationSeed?: string | null
}

interface ExperimentModelConfigResponse {
  provider: string
  model: string
  modelVersion?: string | null
  reasoningEffort?: string | null
  temperature?: number | null
  maxOutputTokens?: number | null
}

interface ExperimentBudgetResponse {
  toolCallCap: number
  contextTokenBudget: number
  maxDurationMs: number
}

interface StrategyMetricsResponse {
  strategy: ExperimentStrategy
  /** CS-CORE-20261009-015: `null` si la estrategia no tiene repeticiones evaluables. */
  validRate: number | null
  compilationRate: number | null
  executionRate: number | null
  passedRate: number | null
  generationDurationMs: number | null
  executionDurationMs: number | null
  totalDurationMs: number | null
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  estimatedCost: number | null
  retrievedChunks: number | null
  selectedChunks: number | null
  contextTokens: number | null
  toolCalls: number | null
  filesInspected: number | null
  failures: Partial<Record<FailureType, number>>
  evaluableRepetitions?: number
  nonEvaluableRepetitions?: number
}

interface ExperimentRepetitionResponse {
  repetition: 1 | 2 | 3
  strategy: ExperimentStrategy
  valid: boolean
  failureType: FailureType
  generationDurationMs?: number | null
  /** CS-CORE-20261009-008/-009: `null` si el Sandbox no se invocó; número si la llamada falló tras medirse. */
  executionDurationMs?: number | null
  totalDurationMs: number
  totalTokens: number | null
  errorSummary: string | null
  /** INTEROP-2.7 §6.5.1, opcionales. */
  pairId?: string | null
  pairPosition?: 1 | 2 | null
  attempt?: number | null
  technicallyEvaluable?: boolean | null
}

export interface ExperimentResultsResponse {
  experimentId: string
  analysisRunId: string
  projectVersionId: string
  symbol: import('../control-plane/types').AnalysisSymbolResponse
  repetitionsPerStrategy: 3
  strategies: StrategyMetricsResponse[]
  repetitions: ExperimentRepetitionResponse[]
  completedAt: string
}

function toStrategyMetrics(metrics: StrategyMetricsResponse): StrategyMetrics {
  return {
    strategy: metrics.strategy,
    validRate: metrics.validRate ?? null,
    compilationRate: metrics.compilationRate ?? null,
    executionRate: metrics.executionRate ?? null,
    passedRate: metrics.passedRate ?? null,
    generationDurationMs: metrics.generationDurationMs ?? null,
    executionDurationMs: metrics.executionDurationMs ?? null,
    totalDurationMs: metrics.totalDurationMs ?? null,
    totalTokens: metrics.totalTokens,
    estimatedCost: metrics.estimatedCost,
    failures: metrics.failures,
    retrievedChunks: metrics.retrievedChunks,
    selectedChunks: metrics.selectedChunks,
    contextTokens: metrics.contextTokens,
    toolCalls: metrics.toolCalls,
    filesInspected: metrics.filesInspected,
    evaluableRepetitions: metrics.evaluableRepetitions,
    nonEvaluableRepetitions: metrics.nonEvaluableRepetitions,
  }
}

const isPresent = (value: unknown): boolean => value !== undefined && value !== null

/**
 * Configuración INTEROP-2.7 §6.5.1. Devuelve `null` solo si Core no trajo ninguno de los campos (corrida previa a OE5).
 * Si trae algunos, la configuración es parcial: cada campo ausente queda `null` y la UI lo marca «no disponible» por separado.
 * Nunca inventa valores.
 */
export function toExperimentConfiguration(status: ExperimentStatusResponse): ExperimentConfiguration | null {
  const { model, budget, executionProfile, runnerHint, randomizationSeed } = status
  if (![model, budget, executionProfile, runnerHint, randomizationSeed].some(isPresent)) return null
  return {
    model: model ? {
      provider: model.provider ?? null,
      model: model.model ?? null,
      modelVersion: model.modelVersion ?? null,
      reasoningEffort: model.reasoningEffort ?? null,
      temperature: model.temperature ?? null,
      maxOutputTokens: model.maxOutputTokens ?? null,
    } : null,
    budget: budget ? {
      toolCallCap: budget.toolCallCap ?? null,
      contextTokenBudget: budget.contextTokenBudget ?? null,
      maxDurationMs: budget.maxDurationMs ?? null,
    } : null,
    executionProfile: executionProfile ?? null,
    runnerHint: runnerHint ?? null,
    randomizationSeed: randomizationSeed ?? null,
  }
}

export function toExperimentResultViewModel(results: ExperimentResultsResponse, targetLabel: string, configuration: ExperimentConfiguration | null = null): ExperimentResultViewModel {
  const rag = results.strategies.find((item) => item.strategy === 'RAG')
  const agent = results.strategies.find((item) => item.strategy === 'GENERALIST_AGENT')
  if (!rag || !agent) throw new Error('El experimento no trae métricas para ambas estrategias.')

  return {
    baseline: toStrategyMetrics(agent),
    rag: toStrategyMetrics(rag),
    repetitions: results.repetitions.map((repetition) => ({
      target: targetLabel,
      repetition: repetition.repetition,
      strategy: repetition.strategy,
      valid: repetition.valid,
      failureType: repetition.failureType,
      generationDurationMs: repetition.generationDurationMs ?? null,
      executionDurationMs: repetition.executionDurationMs ?? null,
      totalDurationMs: repetition.totalDurationMs,
      totalTokens: repetition.totalTokens,
      errorSummary: repetition.errorSummary,
      pairId: repetition.pairId ?? null,
      pairPosition: repetition.pairPosition ?? null,
      attempt: repetition.attempt ?? null,
      technicallyEvaluable: repetition.technicallyEvaluable ?? null,
    })),
    configuration,
  }
}

export function toExperimentOperation(status: ExperimentStatusResponse, results: ExperimentResultsResponse | null, targetLabel: string): ExperimentOperation {
  const configuration = toExperimentConfiguration(status)
  return {
    id: status.id,
    status: status.status,
    progress: status.totalRepetitions > 0 ? Math.round(status.completedRepetitions / status.totalRepetitions * 100) : 0,
    result: results ? toExperimentResultViewModel(results, targetLabel, configuration) : undefined,
    configuration,
    failureCode: status.failureCode ?? null,
    failureMessage: status.failureMessage ?? null,
  }
}
