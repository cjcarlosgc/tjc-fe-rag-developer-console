import { apiRequest } from '../api/client'
import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetAnalysisOperation, mockGetAnalysisResult, mockListAnalysisHistory, mockUploadProjectVersion } from '../api/mockBackend'
import type { AnalysisHistoryItem, AnalysisOperation, AnalysisResult, UploadAccepted } from '../projects/types'

export function uploadProjectVersion(projectId: string, file: File): Promise<UploadAccepted> {
  if (getDataSource() === 'mock') return mockUploadProjectVersion(projectId, file)
  const body = new FormData()
  body.append('file', file)
  body.append('projectId', projectId)
  return apiRequest<UploadAccepted>('/projects/index', {
    method: 'POST',
    body,
  })
}

export function getAnalysisOperation(projectVersionId: string, signal?: AbortSignal): Promise<AnalysisOperation> {
  if (getDataSource() === 'mock') return mockGetAnalysisOperation(projectVersionId)
  return apiRequest<AnalysisOperation>(`/project-versions/${encodeURIComponent(projectVersionId)}`, { signal })
}

export function getAnalysisResult(projectVersionId: string, signal?: AbortSignal): Promise<AnalysisResult> {
  if (getDataSource() === 'mock') return mockGetAnalysisResult(projectVersionId)
  return apiRequest<AnalysisResult>(`/project-versions/${encodeURIComponent(projectVersionId)}/results`, { signal })
}

export function listAnalysisHistory(projectId: string): Promise<AnalysisHistoryItem[]> {
  if (getDataSource() === 'mock') return mockListAnalysisHistory(projectId)
  return Promise.reject(new PendingContractError('el historial de ProjectVersions por proyecto'))
}
