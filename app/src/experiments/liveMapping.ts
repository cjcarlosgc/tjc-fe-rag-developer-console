import type { ExperimentConfiguration, ExperimentOperation, ExperimentResultViewModel, ExperimentStrategy, FailureType, StrategyMetrics } from './types'

/**
 * `ExperimentResultsResponse` (INTEROP-1.5) trae `strategies: StrategyMetricsResponse[]` (RAG +
 * GENERALIST_AGENT) y `repetitions` sin campo `target` (una sola pieza por experimento). Este
 * módulo lo combina con `ExperimentStatusResponse` en el mismo `{baseline, rag}` view model que
 * ya consume `ExperimentComparison`.
 */

export interface ExperimentStatusResponse {
  id: string
  projectId: string
  projectVersionId: string
  targetId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  completedRepetitions: number
  totalRepetitions: number
  failureCode: string | null
  failureMessage: string | null
  startedAt: string | null
  completedAt: string | null
  /** INTEROP-2.7 §6.5.1, opcionales: Core aún puede no enviarlos. */
  model?: ExperimentModelConfigResponse
  budget?: ExperimentBudgetResponse
  executionProfile?: string
  runnerHint?: string
  randomizationSeed?: string
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
  validRate: number
  compilationRate: number
  executionRate: number
  passedRate: number
  generationDurationMs: number
  executionDurationMs: number
  totalDurationMs: number
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
}

interface ExperimentRepetitionResponse {
  repetition: 1 | 2 | 3
  strategy: ExperimentStrategy
  valid: boolean
  failureType: FailureType
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
  projectVersionId: string
  targetId: string
  repetitionsPerStrategy: 3
  strategies: StrategyMetricsResponse[]
  repetitions: ExperimentRepetitionResponse[]
  completedAt: string
}

function toStrategyMetrics(metrics: StrategyMetricsResponse): StrategyMetrics {
  return {
    strategy: metrics.strategy,
    validRate: metrics.validRate,
    compilationRate: metrics.compilationRate,
    executionRate: metrics.executionRate,
    passedRate: metrics.passedRate,
    totalDurationMs: metrics.totalDurationMs,
    totalTokens: metrics.totalTokens,
    estimatedCost: metrics.estimatedCost,
    failures: metrics.failures,
    retrievedChunks: metrics.retrievedChunks,
    selectedChunks: metrics.selectedChunks,
    contextTokens: metrics.contextTokens,
    toolCalls: metrics.toolCalls,
    filesInspected: metrics.filesInspected,
  }
}

/** Solo devuelve configuración si están todos los campos requeridos; nunca inventa valores. */
export function toExperimentConfiguration(status: ExperimentStatusResponse): ExperimentConfiguration | null {
  const { model, budget, executionProfile, runnerHint, randomizationSeed } = status
  if (!model?.provider || !model.model) return null
  if (!budget || budget.toolCallCap == null || budget.contextTokenBudget == null || budget.maxDurationMs == null) return null
  if (executionProfile == null || runnerHint == null || randomizationSeed == null) return null
  return {
    model: {
      provider: model.provider,
      model: model.model,
      modelVersion: model.modelVersion ?? null,
      reasoningEffort: model.reasoningEffort ?? null,
      temperature: model.temperature ?? null,
      maxOutputTokens: model.maxOutputTokens ?? null,
    },
    budget: { toolCallCap: budget.toolCallCap, contextTokenBudget: budget.contextTokenBudget, maxDurationMs: budget.maxDurationMs },
    executionProfile,
    runnerHint,
    randomizationSeed,
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
      durationMs: repetition.totalDurationMs,
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
  }
}
