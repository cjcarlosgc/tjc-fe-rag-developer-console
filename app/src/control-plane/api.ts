import { apiRequest } from '../api/client'
import { getDataSource, PendingContractError } from '../api/dataSource'
import {
  mockCompleteGitHubInstallation,
  mockCreateTestPublication,
  mockDisconnectRepository,
  mockGetAnalysisRun,
  mockGetRepositoryBinding,
  mockGetTestPublication,
  mockListAnalysisRuns,
  mockListTestProposals,
  mockStartGitHubInstallation,
} from '../api/mockBackend'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  CompleteGitHubInstallationRequest,
  CreateTestPublicationRequest,
  GeneratedTestProposalSetResponse,
  GitHubInstallationSessionResponse,
  ProjectRepositoryBindingResponse,
  TestPublicationAcceptedResponse,
  TestPublicationResponse,
} from './types'

// HU30 — repository binding / GitHub App. RAG Core todavía no publica estas rutas (INTEROP-2.0 §6.8).

export function getRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  if (getDataSource() === 'mock') return mockGetRepositoryBinding(projectId)
  return Promise.reject(new PendingContractError('el repository binding de un proyecto'))
}

export function startGitHubInstallation(projectId: string): Promise<GitHubInstallationSessionResponse> {
  if (getDataSource() === 'mock') return mockStartGitHubInstallation(projectId)
  return Promise.reject(new PendingContractError('la instalación de la GitHub App'))
}

export function completeGitHubInstallation(projectId: string, input: CompleteGitHubInstallationRequest): Promise<ProjectRepositoryBindingResponse> {
  if (getDataSource() === 'mock') return mockCompleteGitHubInstallation(projectId, input)
  return Promise.reject(new PendingContractError('completar la instalación de la GitHub App'))
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
  if (!projectId) return Promise.reject(new PendingContractError('un listado global de Analysis Runs — INTEROP-2.1 §6.10 solo aprueba el listado por proyecto'))
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
