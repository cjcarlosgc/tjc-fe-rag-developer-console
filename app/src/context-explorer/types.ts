export type ContextTraceKind = 'RAG' | 'AGENT'
export type ContextTraceStrategy = 'RAG' | 'GENERALIST_AGENT'

export interface ContextTraceSummary {
  id: string
  kind: ContextTraceKind
  projectVersionId: string
  targetId: string
  testRunId: string | null
  experimentId: string | null
  strategy: ContextTraceStrategy
  repetition: 1 | 2 | 3 | null
  attempt: number
  current: boolean
  artifactIds: string[]
  createdAt: string
}

export interface SourceLine { lineNumber: number; content: string }

export interface SourceExcerpt {
  filePath: string
  symbolName: string | null
  parentSymbolName: string | null
  startLine: number | null
  endLine: number | null
  snippet: string
  before: SourceLine[]
  after: SourceLine[]
  contentSha256: string
  truncated: boolean
}

export type RagMatchedVia = 'SEMANTIC' | 'IMPORTS' | 'IMPORTED_BY'
export type RagCandidateDecision = 'SELECTED' | 'DISCARDED'
export type RagDiscardReason = 'BELOW_MINIMUM_SCORE' | 'TOP_K_LIMIT' | 'TOKEN_BUDGET'

export interface RagTargetNode { chunkIds: string[]; excerpt: SourceExcerpt; tokenCount: number }

export interface RagCandidateNode {
  chunkId: string
  rank: number
  excerpt: SourceExcerpt
  tokenCount: number
  semanticScore: number | null
  structuralMatch: 'IMPORTS' | 'IMPORTED_BY' | null
  combinedScore: number
  matchedVia: RagMatchedVia[]
  decision: RagCandidateDecision
  discardReason: RagDiscardReason | null
}

export interface RagContextTraceDetail extends ContextTraceSummary {
  kind: 'RAG'
  target: RagTargetNode
  candidates: RagCandidateNode[]
  retrievedChunks: number
  selectedChunks: number
  contextTokens: number
  configuration: { minimumScore: number; topK: number; maxContextTokens: number; semanticWeight: number; structuralWeight: number }
}

export type AgentToolName = 'list_files' | 'search_text' | 'inspect_symbol' | 'read_file'
export type AgentStepStatus = 'SUCCEEDED' | 'EMPTY' | 'FAILED'
export type AgentObservationKind = 'FILE_LIST_SUMMARY' | 'TEXT_MATCH' | 'SYMBOL' | 'FILE_CONTENT'

export interface AgentObservation {
  kind: AgentObservationKind
  filePath: string | null
  symbolName: string | null
  excerpt: SourceExcerpt | null
  discoveredFilesCount: number | null
}

export interface AgentTrajectoryStep {
  step: number
  toolName: AgentToolName
  arguments: Record<string, unknown>
  status: AgentStepStatus
  resultSummary: string
  resultSha256: string
  truncated: boolean
  observations: AgentObservation[]
}

export interface AgentContextTraceDetail extends ContextTraceSummary {
  kind: 'AGENT'
  trajectory: AgentTrajectoryStep[]
  toolCalls: number
  filesInspected: number
}

export type ContextTraceDetail = RagContextTraceDetail | AgentContextTraceDetail

export interface ContextTracePage { items: ContextTraceSummary[]; nextCursor: string | null }
export interface DiscoveredFile { filePath: string }
export interface DiscoveredFilePage { items: DiscoveredFile[]; nextCursor: string | null }

export interface ExperimentContextTraceFilters {
  strategy?: ContextTraceStrategy
  repetition?: 1 | 2 | 3
  includeSuperseded?: boolean
  cursor?: string | null
  limit?: number
}
