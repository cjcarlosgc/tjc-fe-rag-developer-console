import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockStartGeneration } from '../api/mockBackend'
import type { GenerationAccepted, GenerationConfiguration } from './types'

/** `POST /test-runs`, exige `Idempotency-Key` estable por acción de confirmación. */
export function startGeneration(configuration: GenerationConfiguration, idempotencyKey: string): Promise<GenerationAccepted> {
  if (getDataSource() === 'mock') return mockStartGeneration(configuration)
  return apiRequest<GenerationAccepted>('/test-runs', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      projectId: configuration.projectId,
      mode: configuration.mode,
      ...(configuration.target ? { targetId: configuration.target.id } : {}),
    }),
  })
}
