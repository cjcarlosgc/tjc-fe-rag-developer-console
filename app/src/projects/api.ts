import { apiRequest } from '../api/client'
import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockCreateProject, mockGetProject, mockListProjects } from '../api/mockBackend'
import type { CreateProjectInput, Project } from './types'

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

export function listProjects(): Promise<Project[]> {
  if (getDataSource() === 'mock') return mockListProjects()
  return Promise.reject(new PendingContractError('el listado de proyectos'))
}
