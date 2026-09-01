import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetArtifacts } from '../api/mockBackend'
import type { ArtifactViewModel } from './types'

export function getArtifacts(runId: string): Promise<ArtifactViewModel[]> {
  if (getDataSource() === 'mock') return mockGetArtifacts(runId)
  return Promise.reject(new PendingContractError('el listado y contenido de artifacts'))
}
