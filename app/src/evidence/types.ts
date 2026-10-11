import type { AnalysisSymbolResponse } from '../control-plane/types'
import type { TracePublicationResponse } from '../control-plane/operationalTraceTypes'
import type { ExperimentStrategy } from '../experiments/types'
import type { RetrievalMetricsResponse, RetrievalMode, StructuralRelation } from '../retrieval-comparison/types'

/**
 * INTEROP-2.7 §6.16 (CS-CORE-20261009-014, forma congelada en `schemaVersion '1'`).
 * Los tipos reproducen el bloque del contrato sin campos extra. Todo valor `| null` es «sin dato», nunca 0 ni cadena vacía.
 * No hay excerpt, contenido de código, testCases, groundTruth, knowledgeId, URLs ni claves de almacenamiento.
 */
export type EvidenceKind = 'ANALYSIS_RUN' | 'EXPERIMENT' | 'RETRIEVAL_COMPARISON'

export type EvidenceId = string

/** Referencia opaca de snapshot: nunca una URL firmada ni una clave de almacenamiento. */
export type EvidenceSnapshotRef = string

export type EvidenceStrategy = ExperimentStrategy | 'PRODUCT'

export interface EvidenceAnalysisRun {
  analysisRunId: EvidenceId
  repositoryName: string
  pullRequestNumber: number
  headSha: string
  projectVersionId: EvidenceId | null
  snapshotRef: EvidenceSnapshotRef | null
  targets: AnalysisSymbolResponse[]
  createdAt: string
}

export interface EvidenceRetrievalCandidate {
  rank: number | null
  chunkId: EvidenceId | null
  filePath: string | null
  symbolQualifiedName: string | null
  semanticScore: number | null
  structuralRelation: StructuralRelation | null
  combinedScore: number | null
  selected: boolean | null
}

export interface EvidenceRetrievalConfig {
  semanticTopK: number | null
  finalTopK: number | null
  semanticWeight: number | null
  structuralWeight: number | null
  embeddingModel: string | null
}

export interface EvidenceRetrieval {
  retrievalId: EvidenceId
  mode: RetrievalMode
  config: EvidenceRetrievalConfig
  candidates: EvidenceRetrievalCandidate[]
  /** Solo en RETRIEVAL_COMPARISON con groundTruth; `null` si no hay métricas. */
  metrics: RetrievalMetricsResponse | null
}

export interface EvidenceContext {
  contextId: EvidenceId
  selectedChunkIds: EvidenceId[]
  discardedChunkIds: EvidenceId[]
  tokenCounts: { selected: number | null; budget: number | null }
  functionalRuleIds: EvidenceId[]
}

export interface EvidenceGeneration {
  strategy: EvidenceStrategy
  repetition: number | null
  attempt: number | null
  provider: string | null
  model: string | null
  modelVersion: string | null
  reasoningEffort: string | null
  inputTokens: number | null
  outputTokens: number | null
  durationMs: number | null
  artifactHash: string | null
}

export interface EvidenceAgentExplorationStep {
  step: number | null
  toolName: string | null
  status: string | null
}

export interface EvidenceAgentExploration {
  toolCallCap: number | null
  steps: EvidenceAgentExplorationStep[]
  filesInspected: number | null
  contextTokenBudget: number | null
}

export type EvidenceSandboxFactValue = string | number | boolean | null

/**
 * INTEROP-2.7 §6.16: el bundle solo puede transportar estos hechos saneados
 * del Sandbox. Es parcial porque un hecho no observable se omite del objeto;
 * no habilita logs, URLs, evidencia textual ni claves futuras arbitrarias.
 */
export type EvidenceSandboxFactKey =
  | 'executionProfile'
  | 'runner'
  | 'compiled'
  | 'executed'
  | 'passed'
  | 'totalTests'
  | 'passedTests'
  | 'failedTests'
  | 'skippedTests'
  | 'testCasesTruncated'
  | 'failureStage'
  | 'failureCategory'
  | 'failureCode'
  | 'failureMessage'

export interface EvidenceSandbox {
  executionId: string | null
  strategy: EvidenceStrategy
  repetition: number | null
  executionProfile: string | null
  runnerHint: string | null
  attempt: number
  /** Claves cerradas definidas por el contrato; sin logs, evidencias ni URLs y con failureMessage saneado. */
  facts: Partial<Record<EvidenceSandboxFactKey, EvidenceSandboxFactValue>>
  durationMs: number | null
  requestId: string | null
  correlationId: string | null
}

export interface EvidenceExperimental {
  experimentId: EvidenceId
  strategy: ExperimentStrategy
  repetition: number
  pairId: EvidenceId | null
  pairPosition: 1 | 2 | null
  attempt: number
  randomizationSeed: string | null
  /** Refleja la exclusión de repeticiones no evaluables (§6.5.1); no sirve para inferir CF ni CO. */
  technicallyEvaluable: boolean
}

export interface EvidenceBundleResponse {
  schemaVersion: '1'
  kind: EvidenceKind
  subjectId: EvidenceId
  generatedAt: string
  correlationId: string
  analysisRun: EvidenceAnalysisRun | null
  retrieval: EvidenceRetrieval[]
  context: EvidenceContext[]
  generation: EvidenceGeneration[]
  agentExploration: EvidenceAgentExploration[]
  sandbox: EvidenceSandbox[]
  experimental: EvidenceExperimental[]
  publication: TracePublicationResponse | null
}
