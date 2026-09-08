import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetRun, mockListTestRunHistory, mockRetryTarget } from '../api/mockBackend'
import { isTerminalCoreStatus, toRunViewModel, type TestRunResultsResponse, type TestRunStatusResponse } from './liveMapping'
import type { RunViewModel, TargetRetryAccepted, TestRunHistoryPage } from './types'

/** `GET /test-runs/{runId}` (+ `/results` cuando ya es terminal, para el detalle por target). */
export async function getRun(runId: string): Promise<RunViewModel> {
  if (getDataSource() === 'mock') return mockGetRun(runId)
  const status = await apiRequest<TestRunStatusResponse>(`/test-runs/${encodeURIComponent(runId)}`)
  if (!isTerminalCoreStatus(status.status)) return toRunViewModel(status, null)
  const results = await apiRequest<TestRunResultsResponse>(`/test-runs/${encodeURIComponent(runId)}/results`)
  return toRunViewModel(status, results)
}

/** HU20: `GET /project-versions/{projectVersionId}/test-runs?cursor&limit`. */
export function listTestRunHistory(projectVersionId: string, cursor?: string | null): Promise<TestRunHistoryPage> {
  if (getDataSource() === 'mock') return mockListTestRunHistory(projectVersionId, cursor ?? null)
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiRequest<TestRunHistoryPage>(`/project-versions/${encodeURIComponent(projectVersionId)}/test-runs${query}`)
}

/** HU24: `POST /test-runs/{runId}/targets/{targetId}/retry`, exige `Idempotency-Key`. */
export function retryTarget(runId: string, targetId: string, idempotencyKey: string): Promise<TargetRetryAccepted> {
  if (getDataSource() === 'mock') return mockRetryTarget(runId, targetId)
  return apiRequest<TargetRetryAccepted>(`/test-runs/${encodeURIComponent(runId)}/targets/${encodeURIComponent(targetId)}/retry`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
