import { getDataSource, PendingContractError } from '../api/dataSource'
import { loadMockBackend } from '../api/loadMockBackend'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import type { RunComparisonAccepted, RunComparisonListPage, RunComparisonOperation } from './types'

/** INTEROP-2.1 §6.5 (HU48). Ver types.ts — contrato definido, Core no lo implementó todavía. */
export function startRunComparison(analysisRunId: string, symbol: AnalysisSymbolResponse): Promise<RunComparisonAccepted> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockStartRunComparison(analysisRunId, symbol))
  return Promise.reject(new PendingContractError('Run comparison sobre un Analysis Run (HU48)'))
}

export function getRunComparison(comparisonId: string): Promise<RunComparisonOperation> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockGetRunComparison(comparisonId))
  return Promise.reject(new PendingContractError('Run comparison sobre un Analysis Run (HU48)'))
}

/** `GET /analysis-runs/{analysisRunId}/experiments` (§6.5) — todos los trials ("Replay") ya lanzados sobre este Run. */
export function listRunComparisons(analysisRunId: string): Promise<RunComparisonListPage> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockListRunComparisons(analysisRunId))
  return Promise.reject(new PendingContractError('Run comparison sobre un Analysis Run (HU48)'))
}
