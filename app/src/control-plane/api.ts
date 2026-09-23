import { ApiError, apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import {
  mockCreateRepositoryBinding,
  mockCreateTestPublication,
  mockDisconnectRepository,
  mockEnableRepository,
  mockGetAnalysisRun,
  mockGetRepositoryBinding,
  mockGetTestPublication,
  mockListAnalysisRuns,
  mockListGitHubRepositoryBranches,
  mockListGitHubUserRepositories,
  mockListTestProposals,
  mockPeekGitHubAppAccess,
  mockVerifyGitHubAppAccess,
} from '../api/mockBackend'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  AnalysisRunSummaryResponse,
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

// HU30 — repository binding / GitHub App, user-centric (INTEROP-2.3 §6.8).

/**
 * `GET /projects/{projectId}/integrations/github` responde `404 REPOSITORY_BINDING_NOT_FOUND` cuando el proyecto nunca se vinculó — se traduce a `null`, igual que el mock.
 * Cualquier otro 404 (p. ej. `PROJECT_NOT_FOUND` de un Project borrado) se propaga: no es "sin binding". Un binding desconectado llega como `DISABLED`, no como `null`.
 */
export async function getRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  if (getDataSource() === 'mock') return mockGetRepositoryBinding(projectId)
  try {
    return await apiRequest<ProjectRepositoryBindingResponse>(`/projects/${encodeURIComponent(projectId)}/integrations/github`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === 'REPOSITORY_BINDING_NOT_FOUND') return null
    throw error
  }
}

/**
 * `GET /integrations/github/repositories` exige `X-GitHub-Provider-Token` (INTEROP-2.3 §6.8) — lo
 * provee la sesión de GitHub OAuth del usuario (`authSession.githubProviderToken`), nunca se
 * persiste ni se reenvía a otro lado.
 */
export function listGitHubUserRepositories(githubProviderToken: string, workspaceId: string): Promise<GitHubUserRepositoryPage> {
  if (getDataSource() === 'mock') return mockListGitHubUserRepositories(workspaceId)
  const query = new URLSearchParams({ workspaceId })
  return apiRequest<GitHubUserRepositoryPage>(`/integrations/github/repositories?${query.toString()}`, { headers: { 'X-GitHub-Provider-Token': githubProviderToken } })
}

export function verifyGitHubAppAccess(input: VerifyGitHubAppAccessRequest): Promise<GitHubAppAccessResponse> {
  if (getDataSource() === 'mock') return mockVerifyGitHubAppAccess(input)
  return apiRequest<GitHubAppAccessResponse>('/integrations/github/repositories/verify-app-access', { method: 'POST', body: JSON.stringify(input) })
}

/**
 * Lectura del estado de acceso de la App (y su `configureUrl`) a un repositorio ya vinculado. En live es la misma ruta `verify-app-access`;
 * en mock no cuenta como una verificación (a diferencia de `verifyGitHubAppAccess`), para no alterar el resultado determinista de Reactivar.
 */
export function getGitHubAppAccess(input: VerifyGitHubAppAccessRequest): Promise<GitHubAppAccessResponse> {
  if (getDataSource() === 'mock') return mockPeekGitHubAppAccess(input)
  return verifyGitHubAppAccess(input)
}

export function listGitHubRepositoryBranches(owner: string, repo: string): Promise<GitHubRepositoryBranchesResponse> {
  if (getDataSource() === 'mock') return mockListGitHubRepositoryBranches(owner, repo)
  return apiRequest<GitHubRepositoryBranchesResponse>(`/integrations/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`)
}

export function createRepositoryBinding(projectId: string, input: CreateRepositoryBindingRequest): Promise<ProjectRepositoryBindingResponse> {
  if (getDataSource() === 'mock') return mockCreateRepositoryBinding(projectId, input)
  return apiRequest<ProjectRepositoryBindingResponse>(`/projects/${encodeURIComponent(projectId)}/integrations/github`, { method: 'POST', body: JSON.stringify(input) })
}

export function disconnectRepository(projectId: string): Promise<void> {
  if (getDataSource() === 'mock') return mockDisconnectRepository(projectId)
  return apiRequest<void>(`/projects/${encodeURIComponent(projectId)}/integrations/github`, { method: 'DELETE' })
}

/**
 * HU57 (INTEROP-2.3 §6.8, implementado en Core — CS-20260920-003): `POST /projects/{projectId}/integrations/github/enable` — reactiva un
 * binding `DISABLED` (y `REVOKED` si Core revalida que la App recuperó acceso; si no, 403 `GITHUB_APP_ACCESS_REQUIRED` y el estado no cambia).
 * Idempotente y sin cuerpo: el contrato no define uno.
 */
export function enableRepository(projectId: string): Promise<ProjectRepositoryBindingResponse> {
  if (getDataSource() === 'mock') return mockEnableRepository(projectId)
  return apiRequest<ProjectRepositoryBindingResponse>(`/projects/${encodeURIComponent(projectId)}/integrations/github/enable`, { method: 'POST' })
}

// HU32 — Analysis Runs por PR/HEAD (INTEROP-2.1 §6.10).

const AGGREGATE_PAGE_SIZE = 100

/**
 * `GET /projects/{projectId}/analysis-runs?status&cursor&limit` cuando se pide un Project,
 * o `GET /analysis-runs?status&cursor&limit` para los Projects visibles del usuario (HU55).
 */
export function listAnalysisRuns(projectId?: string, status?: AnalysisRunStatus, cursor?: string | null, limit?: number): Promise<AnalysisRunListPage> {
  if (getDataSource() === 'mock') return mockListAnalysisRuns(projectId, status)
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  const path = projectId ? `/projects/${encodeURIComponent(projectId)}/analysis-runs` : '/analysis-runs'
  return apiRequest<AnalysisRunListPage>(`${path}${query ? `?${query}` : ''}`)
}

/** Consume todas las páginas del listado global para agregar actividad completa por workspace. */
export async function listAllAnalysisRuns(): Promise<AnalysisRunSummaryResponse[]> {
  const items: AnalysisRunSummaryResponse[] = []
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  do {
    if (cursor && seenCursors.has(cursor)) throw new Error('La paginación de Analysis Runs no avanzó; vuelve a intentarlo.')
    if (cursor) seenCursors.add(cursor)
    const page = await listAnalysisRuns(undefined, undefined, cursor, AGGREGATE_PAGE_SIZE)
    items.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return items
}

export function getAnalysisRun(analysisRunId: string): Promise<AnalysisRunDetailResponse> {
  if (getDataSource() === 'mock') return mockGetAnalysisRun(analysisRunId)
  return apiRequest<AnalysisRunDetailResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}`)
}

// HU39/HU40 — Checks, propuestas y companion PR (INTEROP-2.2 §6.12, implementado y desplegado en Core).

export function listTestProposals(analysisRunId: string): Promise<GeneratedTestProposalSetResponse> {
  if (getDataSource() === 'mock') return mockListTestProposals(analysisRunId)
  return apiRequest<GeneratedTestProposalSetResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}/test-proposals`)
}

/** Solo propuestas `AVAILABLE` de un Run `SUCCESS` y vigente — Core valida esto server-side y rechaza si no. */
export function createTestPublication(analysisRunId: string, input: CreateTestPublicationRequest): Promise<TestPublicationAcceptedResponse> {
  if (getDataSource() === 'mock') return mockCreateTestPublication(analysisRunId, input)
  return apiRequest<TestPublicationAcceptedResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}/test-publications`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** `STALE` significa que el HEAD del PR cambió entre pedir publicar y que corriera el job — hay que re-listar `test-proposals` contra el Run vigente. */
export function getTestPublication(publicationId: string): Promise<TestPublicationResponse> {
  if (getDataSource() === 'mock') return mockGetTestPublication(publicationId)
  return apiRequest<TestPublicationResponse>(`/test-publications/${encodeURIComponent(publicationId)}`)
}
