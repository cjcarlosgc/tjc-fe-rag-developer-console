import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetRun } from '../api/mockBackend'
import type { RunViewModel } from './types'

export function getRun(runId: string): Promise<RunViewModel> {
  if (getDataSource() === 'mock') return mockGetRun(runId)
  return Promise.reject(new PendingContractError('el status y resultados de TestGenerationRun'))
}
