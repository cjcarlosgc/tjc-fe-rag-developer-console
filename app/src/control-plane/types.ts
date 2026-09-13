/** SDD 2.0 / INTEROP-2.0 §6.8, §6.10, §6.12 — control plane PR-driven (Project↔Repository → PR/HEAD → Run → Check/Proposal). */

// §6.8 — GitHub App y repository binding (HU30)

export type RepositoryBindingStatus = 'ENABLED' | 'DISABLED' | 'REVOKED'

export interface GitHubInstallationSessionResponse {
  projectId: string
  installationUrl: string
  stateExpiresAt: string
}

export interface CompleteGitHubInstallationRequest {
  installationId: string
  repositoryId: string
  state: string
  integrationBranch?: string
}

export interface ProjectRepositoryBindingResponse {
  projectId: string
  installationId: string
  repositoryId: string
  repositoryName: string
  integrationBranch: string
  status: RepositoryBindingStatus
  createdAt: string
  updatedAt: string
}

// §6.10 — Analysis Runs (HU32)

export type AnalysisRunStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'ACTION_REQUIRED'
  | 'SUCCESS'
  | 'BEHAVIORAL_MISMATCH'
  | 'TECHNICAL_GENERATION_FAILURE'
  | 'INFRASTRUCTURE_FAILURE'
  | 'BASELINE_FAILED'
  | 'NO_ADDITIONAL_TESTS_REQUIRED'
  | 'NO_TEST_RELEVANT_CHANGES'
  | 'OBSOLETE'

export interface PullRequestRefResponse {
  repositoryId: string
  repositoryName: string
  number: number
  title: string
  baseRef: string
  headRef: string
  baseSha: string
  headSha: string
  draft: boolean
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  actorLogin: string | null
}

export interface AnalysisRunSummaryResponse {
  id: string
  projectId: string
  pullRequest: PullRequestRefResponse
  status: AnalysisRunStatus
  current: boolean
  actionRequiredCount: number
  generatedTestsCount: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type SymbolChangeKind = 'DIRECTLY_CHANGED' | 'POTENTIALLY_IMPACTED'

/** Símbolo del control plane PR-driven; distinto de los targets del dominio de generación legacy (`runs/types.ts`). */
export interface AnalysisSymbolResponse {
  language: 'TYPESCRIPT' | 'PHP'
  kind: 'CLASS' | 'METHOD' | 'FUNCTION' | 'INTERFACE' | 'TYPE' | 'TRAIT' | 'ENUM'
  qualifiedName: string
  filePath: string
  changeKind: SymbolChangeKind
}

export interface AnalysisRunDetailResponse extends AnalysisRunSummaryResponse {
  attemptCount: number
  indexMode: 'BOOTSTRAP' | 'INCREMENTAL'
  changesetBaseSha: string
  changesetHeadSha: string
  indexDeltaBaseSha: string | null
  symbols: AnalysisSymbolResponse[]
  functionalBehaviorValidated: boolean
  resultSummary: string | null
  detailsUrl: string
}

/** `GET /projects/{projectId}/analysis-runs?status&cursor&limit` -> `Page<AnalysisRunSummaryResponse>`. */
export interface AnalysisRunListPage {
  items: AnalysisRunSummaryResponse[]
  nextCursor: string | null
}

// §6.12 — Checks, propuestas y companion PR (HU39/HU40)

export type TestProposalStatus = 'AVAILABLE' | 'HELD' | 'STALE' | 'PUBLISHED'

export interface GeneratedTestProposalResponse {
  id: string
  relativePath: string
  target: AnalysisSymbolResponse
  contentSha256: string
  status: TestProposalStatus
}

export interface GeneratedTestProposalSetResponse {
  analysisRunId: string
  headSha: string
  items: GeneratedTestProposalResponse[]
}

export interface CreateTestPublicationRequest {
  proposalIds: string[]
}

export interface TestPublicationAcceptedResponse {
  status: 'PENDING'
  pollAfterMs: number
  publicationId: string
  analysisRunId: string
}

export type TestPublicationStatus = 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'STALE' | 'FAILED' | 'CLOSED'

export interface TestPublicationResponse {
  id: string
  analysisRunId: string
  sourceHeadSha: string
  status: TestPublicationStatus
  branchName: string | null
  companionPullRequestNumber: number | null
  companionPullRequestUrl: string | null
  failureMessage: string | null
  createdAt: string
  updatedAt: string
}
