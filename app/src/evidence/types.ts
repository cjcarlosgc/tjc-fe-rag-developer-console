import type { AnalysisSymbolResponse } from '../control-plane/types'
import type { TracePublicationResponse } from '../control-plane/operationalTraceTypes'
import type { ExperimentStrategy } from '../experiments/types'
import type { RetrievalCandidateResponse, RetrievalMode, RetrievalModeResultResponse } from '../retrieval-comparison/types'

/** INTEROP-2.7 §6.16. Tipos del módulo de evidencia; no añadir campos fuera del contrato publicado. */
export type EvidenceKind = 'ANALYSIS_RUN' | 'EXPERIMENT' | 'RETRIEVAL_COMPARISON'

export type EvidenceId = string

export interface EvidenceAnalysisRun {
  analysisRunId: EvidenceId
  repositoryName: string
  pullRequestNumber: number
  headSha: string
  projectVersionId: EvidenceId
  /** Referencia opaca; nunca una URL firmada. */
  snapshotRef: string
  targets: AnalysisSymbolResponse[]
  createdAt: string
}

export interface EvidenceRetrieval {
  retrievalId: EvidenceId
  mode: RetrievalMode
  config: RetrievalModeResultResponse['config']
  candidates: RetrievalCandidateResponse[]
}

export interface EvidenceContext {
  contextId: EvidenceId
  selectedChunkIds: EvidenceId[]
  discardedChunkIds: EvidenceId[]
  tokenCounts: { selected: number; budget: number | null }
  functionalRuleIds: EvidenceId[]
}

export interface EvidenceGeneration {
  strategy: ExperimentStrategy | 'PRODUCT'
  provider: string
  model: string
  modelVersion: string | null
  reasoningEffort: string | null
  inputTokens: number | null
  outputTokens: number | null
  durationMs: number
  artifactHash: string
}

export interface EvidenceAgentExploration {
  toolCallCap: number
  steps: { step: number; toolName: string; status: string }[]
  filesInspected: number | null
  contextTokenBudget: number
}

export type EvidenceSandboxFactValue = string | number | boolean | null

export interface EvidenceSandbox {
  executionId: string
  executionProfile: string
  runnerHint: string
  attempt: number
  /** Claves cerradas definidas por el contrato; sin logs, evidencias ni URLs. */
  facts: Record<string, EvidenceSandboxFactValue>
  durationMs: number
  requestId: string
  correlationId: string
}

export interface EvidenceExperimental {
  experimentId: EvidenceId
  strategy: ExperimentStrategy
  repetition: number
  pairId: EvidenceId
  pairPosition: 1 | 2
  attempt: number
  randomizationSeed: string
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
