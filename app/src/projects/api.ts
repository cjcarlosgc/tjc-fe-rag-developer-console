import { ApiError, apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { loadMockBackend } from '../api/loadMockBackend'
import type {
  CreateProjectInput,
  ExperimentCapturePage,
  ExperimentCaptureResponse,
  Project,
  ProjectListPage,
  UpdateProjectInput,
  WorkspaceListResponse,
} from './types'

const AGGREGATE_PAGE_SIZE = 100

/** INTEROP-2.25 §6.17: `GET /projects/{projectId}/experiment-captures?cursor&limit` (Reader). Más reciente primero. */
export function listExperimentCaptures(projectId: string, cursor?: string | null, limit?: number): Promise<ExperimentCapturePage> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockListExperimentCaptures(projectId, limit))
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return apiRequest<ExperimentCapturePage>(`/projects/${encodeURIComponent(projectId)}/experiment-captures${query ? `?${query}` : ''}`)
}

/** INTEROP-2.25 §6.17: `POST /projects/{projectId}/experiment-captures`, sin cuerpo y sin `Idempotency-Key` (Maintainer). */
export function armExperimentCapture(projectId: string): Promise<ExperimentCaptureResponse> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockArmExperimentCapture(projectId))
  return apiRequest<ExperimentCaptureResponse>(`/projects/${encodeURIComponent(projectId)}/experiment-captures`, { method: 'POST' })
}

/** INTEROP-2.25 §6.17: `DELETE /projects/{projectId}/experiment-captures/current` (Maintainer). Sin captura `ARMED`: `404 EXPERIMENT_CAPTURE_NOT_ARMED`. */
export function disarmExperimentCapture(projectId: string): Promise<ExperimentCaptureResponse> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockDisarmExperimentCapture(projectId))
  return apiRequest<ExperimentCaptureResponse>(`/projects/${encodeURIComponent(projectId)}/experiment-captures/current`, {
    method: 'DELETE',
  })
}

export function listWorkspaces(): Promise<WorkspaceListResponse> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockListWorkspaces())
  return apiRequest<WorkspaceListResponse>('/workspaces')
}

export function getProject(projectId: string): Promise<Project> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockGetProject(projectId))
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`)
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockCreateProject(input))
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function renameProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockRenameProject(projectId, input))
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', body: JSON.stringify(input) })
}

/** `GET /projects?workspaceId&cursor&limit`. */
export function listProjects(workspaceId: string, cursor?: string | null, limit?: number): Promise<ProjectListPage> {
  if (getDataSource() === 'mock')
    return loadMockBackend()
      .then((mock) => mock.mockListProjects(workspaceId))
      .then((items) => ({ items, nextCursor: null }))
  const params = new URLSearchParams({ workspaceId })
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', String(limit))
  return apiRequest<ProjectListPage>(`/projects?${params.toString()}`)
}

/** Lee todas las páginas para que los scopes y conteos del workspace no dependan de cuántas tarjetas se hayan cargado. */
export async function listAllProjects(workspaceId: string): Promise<Project[]> {
  const items: Project[] = []
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  do {
    if (cursor && seenCursors.has(cursor)) throw new Error('La paginación de Projects no avanzó; vuelve a intentarlo.')
    if (cursor) seenCursors.add(cursor)
    const page = await listProjects(workspaceId, cursor, AGGREGATE_PAGE_SIZE)
    items.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return items
}

/**
 * HU56 (INTEROP-2.3 §6.1, implementado en Core — CS-20260920-003): `DELETE /projects/{projectId}` -> 204, borrado lógico sin restauración.
 * Un reintento sobre un Project ya borrado (o ajeno/inexistente) responde `404 PROJECT_NOT_FOUND`: se trata como éxito, en live y en mock.
 */
export function deleteProject(projectId: string): Promise<void> {
  const request =
    getDataSource() === 'mock'
      ? loadMockBackend().then((mock) => mock.mockDeleteProject(projectId))
      : apiRequest<void>(`/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })
  return request.catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404 && error.code === 'PROJECT_NOT_FOUND') return
    throw error
  })
}
