import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetExperiment, mockStartExperiment } from '../api/mockBackend'
import { toExperimentOperation, type ExperimentResultsResponse, type ExperimentStatusResponse } from './liveMapping'
import type { ExperimentAccepted, ExperimentOperation } from './types'

/** `POST /experiments`, exige `Idempotency-Key`. `targetId` es el id real del target (METHOD/FUNCTION). */
export function startExperiment(projectId: string, targetId: string, idempotencyKey: string): Promise<ExperimentAccepted> {
  if (getDataSource() === 'mock') return mockStartExperiment(projectId, targetId)
  return apiRequest<ExperimentAccepted>('/experiments', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ projectId, targetId }),
  })
}

/** `GET /experiments/{id}` (+ `/results` cuando ya es COMPLETED). `targetLabel` es solo para mostrar en la tabla de repeticiones. */
export async function getExperiment(experimentId: string, targetLabel: string): Promise<ExperimentOperation> {
  if (getDataSource() === 'mock') return mockGetExperiment(experimentId)
  const status = await apiRequest<ExperimentStatusResponse>(`/experiments/${encodeURIComponent(experimentId)}`)
  if (status.status !== 'COMPLETED') return toExperimentOperation(status, null, targetLabel)
  const results = await apiRequest<ExperimentResultsResponse>(`/experiments/${encodeURIComponent(experimentId)}/results`)
  return toExperimentOperation(status, results, targetLabel)
}
