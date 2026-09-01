import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetExperiment, mockStartExperiment } from '../api/mockBackend'
import type { ExperimentAccepted, ExperimentOperation } from './types'

export function startExperiment(projectId: string, targetLabel: string): Promise<ExperimentAccepted> {
  if (getDataSource() === 'mock') return mockStartExperiment(projectId, targetLabel)
  return Promise.reject(new PendingContractError('la comparación RAG vs baseline'))
}

export function getExperiment(experimentId: string): Promise<ExperimentOperation> {
  if (getDataSource() === 'mock') return mockGetExperiment(experimentId)
  return Promise.reject(new PendingContractError('el status y resultados del experimento'))
}
