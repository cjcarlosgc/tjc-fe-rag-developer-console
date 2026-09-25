/** SDD 3.0 / INTEROP-2.4 — control plane PR-driven (Project↔Repository → PR/HEAD → Run → Check/Proposal). */

/**
 * §6.8 — GitHub App y repository binding (HU30, INTEROP-2.2 — discovery user-centric,
 * autorización/binding GitHub-App-centric). Reemplaza el flujo installation-centric anterior:
 * discovery vía provider token OAuth → verificar acceso de la App a un repo concreto → listar
 * sus ramas reales → crear el binding. `installationId` nunca viaja desde el navegador, lo
 * resuelve Core.
 */
export type RepositoryBindingStatus = 'ENABLED' | 'DISABLED' | 'REVOKED'

export interface GitHubUserRepositoryResponse {
  repositoryId: string
  name: string
  repositoryName: string // owner/name
  owner: { login: string; type: 'User' | 'Organization'; avatarUrl: string | null }
  private: boolean
  defaultBranch: string
  permissions: { admin: boolean; maintain: boolean; push: boolean; pull: boolean }
}

/** `GET /integrations/github/repositories?cursor&limit` -> `Page<GitHubUserRepositoryResponse>`. */
export interface GitHubUserRepositoryPage {
  items: GitHubUserRepositoryResponse[]
  nextCursor: string | null
}

export type GitHubAppAccessStatus = 'AUTHORIZED' | 'NOT_AUTHORIZED'

export interface VerifyGitHubAppAccessRequest {
  repositoryId: string
  repositoryName: string
}

export interface GitHubAppAccessResponse {
  repositoryId: string
  repositoryName: string
  status: GitHubAppAccessStatus
  installationId: string | null
  app: { displayName: string; configureUrl: string }
}

export interface GitHubRepositoryBranchResponse {
  name: string
  protected: boolean
}

export interface GitHubRepositoryBranchesResponse {
  items: GitHubRepositoryBranchResponse[]
}

export interface CreateRepositoryBindingRequest {
  repositoryId: string
  repositoryName: string
  integrationBranch: string
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

/** Símbolo del control plane PR-driven, distinto de un target de inventario de pruebas. */
export interface AnalysisSymbolResponse {
  language: 'TYPESCRIPT' | 'PHP'
  kind: 'CLASS' | 'METHOD' | 'FUNCTION' | 'INTERFACE' | 'TYPE' | 'TRAIT' | 'ENUM'
  qualifiedName: string
  filePath: string
  changeKind: SymbolChangeKind
}

export type AnalysisRunTransitionReason =
  | 'RUN_CREATED'
  | 'SNAPSHOT_PROCESSING_STARTED'
  | 'FUNCTIONAL_CONTEXT_REQUIRED'
  | 'FUNCTIONAL_ANSWER_CONTINUATION'
  | 'GENERATION_COMPLETED'
  | 'GITHUB_HEAD_SUPERSEDED'
  | 'PULL_REQUEST_CLOSED'
  | 'MANUAL_OBSOLETE'

/** INTEROP-2.1 §6.10 (HU53, definido 2026-09-15). */
export interface AnalysisRunTransitionResponse {
  fromStatus: AnalysisRunStatus | null
  toStatus: AnalysisRunStatus
  reason: AnalysisRunTransitionReason
  occurredAt: string
}

export interface AnalysisRunDetailResponse extends AnalysisRunSummaryResponse {
  attemptCount: number
  indexMode: 'BOOTSTRAP' | 'INCREMENTAL'
  changesetBaseSha: string
  changesetHeadSha: string
  indexDeltaBaseSha: string | null
  symbols: AnalysisSymbolResponse[]
  /**
   * HU53 (INTEROP-2.1 §6.10) — definido, pendiente de implementación en
   * Core: el controller real todavía no lo devuelve, por eso es opcional
   * acá aunque el contrato lo declare requerido. `getAnalysisRun` sí tiene
   * adapter live (§6.10 GET .../{id}), así que este campo debe tolerar
   * ausencia en una respuesta real hasta que Core lo implemente.
   */
  history?: AnalysisRunTransitionResponse[]
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
