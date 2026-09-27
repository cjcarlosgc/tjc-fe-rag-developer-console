import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockListAnalysisHistory } from '../api/mockBackend'
import type { AnalysisHistoryItem, ProjectVersionSummaryResponse } from '../projects/types'

/** `GET /projects/{id}/versions` -> `Page<ProjectVersionSummaryResponse>` (verificado contra el controller real de Core). */
interface ProjectVersionSummaryPage {
  items: ProjectVersionSummaryResponse[]
  nextCursor: string | null
}

function toAnalysisHistoryItem(version: ProjectVersionSummaryResponse): AnalysisHistoryItem {
  const { id, projectId, status, language, originalFileName, filesProcessed, chunksCount, detectedFramework, targetsTotal, targetsWithTest, targetsMissingTest, createdAt, completedAt, current } = version
  return { id, projectId, status, language, originalFileName, filesProcessed, chunksCount, detectedFramework, targetsTotal, targetsWithTest, targetsMissingTest, createdAt, completedAt, current }
}

/** Trae solo la primera página (100 ítems): esta pantalla lista un historial plano, sin paginación en su UI todavía. */
export async function listAnalysisHistory(projectId: string): Promise<AnalysisHistoryItem[]> {
  if (getDataSource() === 'mock') return mockListAnalysisHistory(projectId)
  const page = await apiRequest<ProjectVersionSummaryPage>(`/projects/${encodeURIComponent(projectId)}/versions?limit=100`)
  return page.items.map(toAnalysisHistoryItem)
}
