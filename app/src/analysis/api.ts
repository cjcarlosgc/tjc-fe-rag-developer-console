import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetAnalysisOperation, mockGetAnalysisResult, mockListAnalysisHistory, mockUploadProjectVersion } from '../api/mockBackend'
import type { AnalysisHistoryItem, AnalysisOperation, AnalysisResult, AnalysisStatus, UploadAccepted } from '../projects/types'

/** `GET /projects/{id}/versions` -> `Page<ProjectVersionSummaryResponse>` (verificado contra el controller real de Core). */
interface ProjectVersionSummaryResponse {
  id: string
  projectId: string
  status: AnalysisStatus
  originalFileName: string | null
  sizeBytes: number | null
  filesProcessed: number | null
  chunksCount: number | null
  failureReason: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  detectedFramework: string | null
  targetsTotal: number | null
  targetsWithTest: number | null
  targetsMissingTest: number | null
  current: boolean
}
interface ProjectVersionSummaryPage {
  items: ProjectVersionSummaryResponse[]
  nextCursor: string | null
}

function toAnalysisHistoryItem(version: ProjectVersionSummaryResponse): AnalysisHistoryItem {
  const { id, projectId, status, originalFileName, filesProcessed, chunksCount, detectedFramework, targetsTotal, targetsWithTest, targetsMissingTest, createdAt, completedAt, current } = version
  return { id, projectId, status, originalFileName, filesProcessed, chunksCount, detectedFramework, targetsTotal, targetsWithTest, targetsMissingTest, createdAt, completedAt, current }
}

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

/** Trae solo la primera página (100 ítems): esta pantalla lista un historial plano, sin paginación en su UI todavía. */
export async function listAnalysisHistory(projectId: string): Promise<AnalysisHistoryItem[]> {
  if (getDataSource() === 'mock') return mockListAnalysisHistory(projectId)
  const page = await apiRequest<ProjectVersionSummaryPage>(`/projects/${encodeURIComponent(projectId)}/versions?limit=100`)
  return page.items.map(toAnalysisHistoryItem)
}
