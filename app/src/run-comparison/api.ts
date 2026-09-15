import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetRunComparison, mockStartRunComparison } from '../api/mockBackend'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import type { RunComparisonAccepted, RunComparisonOperation } from './types'

/** INTEROP-2.1 §6.5 (HU48). Ver types.ts — contrato definido, Core no lo implementó todavía. */
export function startRunComparison(analysisRunId: string, symbol: AnalysisSymbolResponse): Promise<RunComparisonAccepted> {
  if (getDataSource() === 'mock') return mockStartRunComparison(analysisRunId, symbol)
  return Promise.reject(new PendingContractError('Run comparison sobre un Analysis Run (HU48)'))
}

export function getRunComparison(comparisonId: string): Promise<RunComparisonOperation> {
  if (getDataSource() === 'mock') return mockGetRunComparison(comparisonId)
  return Promise.reject(new PendingContractError('Run comparison sobre un Analysis Run (HU48)'))
}
