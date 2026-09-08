import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockCreateProject, mockGetProject, mockListProjects } from '../api/mockBackend'
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
