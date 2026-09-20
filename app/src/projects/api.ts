import { ApiError, apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockCreateProject, mockDeleteProject, mockGetProject, mockListProjects } from '../api/mockBackend'
import type { CreateProjectInput, Project, ProjectListPage } from './types'

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

/** `GET /projects?cursor&limit`. */
export function listProjects(cursor?: string | null): Promise<ProjectListPage> {
  if (getDataSource() === 'mock') return mockListProjects().then((items) => ({ items, nextCursor: null }))
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiRequest<ProjectListPage>(`/projects${query}`)
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
