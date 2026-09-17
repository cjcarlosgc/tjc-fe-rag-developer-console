import { apiRequest } from '../api/client'
import { getDataSource, PendingContractError } from '../api/dataSource'
import {
  mockCreateRepositoryBinding,
  mockCreateTestPublication,
  mockDisconnectRepository,
  mockGetAnalysisRun,
  mockGetRepositoryBinding,
  mockGetTestPublication,
  mockListAnalysisRuns,
  mockListGitHubRepositoryBranches,
  mockListGitHubUserRepositories,
  mockListTestProposals,
  mockVerifyGitHubAppAccess,
} from '../api/mockBackend'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  CreateRepositoryBindingRequest,
  CreateTestPublicationRequest,
  GeneratedTestProposalSetResponse,
  GitHubAppAccessResponse,
  GitHubRepositoryBranchesResponse,
  GitHubUserRepositoryPage,
  ProjectRepositoryBindingResponse,
  TestPublicationAcceptedResponse,
  TestPublicationResponse,
  VerifyGitHubAppAccessRequest,
} from './types'

// HU30 — repository binding / GitHub App, user-centric (INTEROP-2.2 §6.8). RAG Core todavía no publica estas rutas.

export function getRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  if (getDataSource() === 'mock') return mockGetRepositoryBinding(projectId)
  return Promise.reject(new PendingContractError('el repository binding de un proyecto'))
}

/**
 * `GET /integrations/github/repositories` exige `X-GitHub-Provider-Token` según el contrato, pero
 * el mock no tiene un servidor real que lo valide — es la UI (`IntegrationsPage`) quien decide si
 * llamar esta función según `authSession.githubProviderToken`, en vez de duplicar esa validación acá.
 */
export function listGitHubUserRepositories(): Promise<GitHubUserRepositoryPage> {
  if (getDataSource() === 'mock') return mockListGitHubUserRepositories()
  return Promise.reject(new PendingContractError('el descubrimiento de repositorios GitHub del usuario'))
}

export function verifyGitHubAppAccess(input: VerifyGitHubAppAccessRequest): Promise<GitHubAppAccessResponse> {
  if (getDataSource() === 'mock') return mockVerifyGitHubAppAccess(input)
  return Promise.reject(new PendingContractError('la verificación de acceso de la GitHub App a un repositorio'))
}

export function listGitHubRepositoryBranches(owner: string, repo: string): Promise<GitHubRepositoryBranchesResponse> {
  if (getDataSource() === 'mock') return mockListGitHubRepositoryBranches(owner, repo)
  return Promise.reject(new PendingContractError('el listado de ramas de un repositorio GitHub'))
}

export function createRepositoryBinding(projectId: string, input: CreateRepositoryBindingRequest): Promise<ProjectRepositoryBindingResponse> {
  if (getDataSource() === 'mock') return mockCreateRepositoryBinding(projectId, input)
  return Promise.reject(new PendingContractError('la creación del repository binding user-centric'))
}

export function disconnectRepository(projectId: string): Promise<void> {
  if (getDataSource() === 'mock') return mockDisconnectRepository(projectId)
  return Promise.reject(new PendingContractError('desconectar el repository binding'))
}

// HU32 — Analysis Runs por PR/HEAD (INTEROP-2.1 §6.10).

/**
 * `GET /projects/{projectId}/analysis-runs?status&cursor&limit`. Core (verificado contra su
 * controller real) exige `projectId` en el path — no existe un listado global. La vista "todos
 * los Runs" de `RunsPage`/`ProjectsPage` no tiene ruta live: se rechaza con un mensaje propio en
 * vez de intentar simular una agregación cross-proyecto que el contrato nunca definió.
 */
export function listAnalysisRuns(projectId?: string, status?: AnalysisRunStatus, cursor?: string | null): Promise<AnalysisRunListPage> {
  if (getDataSource() === 'mock') return mockListAnalysisRuns(projectId, status)
  if (!projectId) return Promise.reject(new PendingContractError('un listado global de Analysis Runs (HU55) — INTEROP-2.1 §6.10 ya define GET /analysis-runs, Core todavía no lo implementó'))
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (cursor) params.set('cursor', cursor)
  const query = params.toString()
  return apiRequest<AnalysisRunListPage>(`/projects/${encodeURIComponent(projectId)}/analysis-runs${query ? `?${query}` : ''}`)
}

export function getAnalysisRun(analysisRunId: string): Promise<AnalysisRunDetailResponse> {
  if (getDataSource() === 'mock') return mockGetAnalysisRun(analysisRunId)
  return apiRequest<AnalysisRunDetailResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}`)
}

// HU39/HU40 — Checks, propuestas y companion PR (INTEROP-2.0 §6.12).

export function listTestProposals(analysisRunId: string): Promise<GeneratedTestProposalSetResponse> {
  if (getDataSource() === 'mock') return mockListTestProposals(analysisRunId)
  return Promise.reject(new PendingContractError('las propuestas de prueba de un Run'))
}

export function createTestPublication(analysisRunId: string, input: CreateTestPublicationRequest): Promise<TestPublicationAcceptedResponse> {
  if (getDataSource() === 'mock') return mockCreateTestPublication(analysisRunId, input)
  return Promise.reject(new PendingContractError('la publicación de tests vía companion PR'))
}

export function getTestPublication(publicationId: string): Promise<TestPublicationResponse> {
  if (getDataSource() === 'mock') return mockGetTestPublication(publicationId)
  return Promise.reject(new PendingContractError('el estado de una publicación de tests'))
}
