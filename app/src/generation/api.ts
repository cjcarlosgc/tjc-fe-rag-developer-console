import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockStartGeneration } from '../api/mockBackend'
import type { GenerationAccepted, GenerationConfiguration } from './types'

export function startGeneration(configuration: GenerationConfiguration): Promise<GenerationAccepted> {
  if (getDataSource() === 'mock') return mockStartGeneration(configuration)
  return Promise.reject(new PendingContractError('la creación de TestGenerationRun'))
}
