import { ApiError, apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockCreateProject, mockDeleteProject, mockGetProject, mockListProjects, mockListWorkspaces, mockRenameProject } from '../api/mockBackend'
import type { CreateProjectInput, Project, ProjectListPage, UpdateProjectInput, WorkspaceListResponse } from './types'

const AGGREGATE_PAGE_SIZE = 100

export function listWorkspaces(): Promise<WorkspaceListResponse> {
  if (getDataSource() === 'mock') return mockListWorkspaces()
  return apiRequest<WorkspaceListResponse>('/workspaces')
}

export function getProject(projectId: string): Promise<Project> {
  if (getDataSource() === 'mock') return mockGetProject(projectId)
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`)
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  if (getDataSource() === 'mock') return mockCreateProject(input)
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function renameProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  if (getDataSource() === 'mock') return mockRenameProject(projectId, input)
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', body: JSON.stringify(input) })
}

/** `GET /projects?workspaceId&cursor&limit`. */
export function listProjects(workspaceId: string, cursor?: string | null, limit?: number): Promise<ProjectListPage> {
  if (getDataSource() === 'mock') return mockListProjects(workspaceId).then((items) => ({ items, nextCursor: null }))
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
  const request = getDataSource() === 'mock'
    ? mockDeleteProject(projectId)
    : apiRequest<void>(`/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })
  return request.catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404 && error.code === 'PROJECT_NOT_FOUND') return
    throw error
  })
}
