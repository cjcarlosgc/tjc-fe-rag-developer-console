import { getDataSource, ProposedCapabilityError } from '../api/dataSource'
import { mockGetRunComparison, mockStartRunComparison } from '../api/mockBackend'
import type { RunComparisonAccepted, RunComparisonOperation } from './types'

/** PROPUESTA — HU48. Ver types.ts. */
export function startRunComparison(analysisRunId: string): Promise<RunComparisonAccepted> {
  if (getDataSource() === 'mock') return mockStartRunComparison(analysisRunId)
  return Promise.reject(new ProposedCapabilityError('Run comparison (HU48)'))
}

export function getRunComparison(comparisonId: string): Promise<RunComparisonOperation> {
  if (getDataSource() === 'mock') return mockGetRunComparison(comparisonId)
  return Promise.reject(new ProposedCapabilityError('Run comparison (HU48)'))
}
