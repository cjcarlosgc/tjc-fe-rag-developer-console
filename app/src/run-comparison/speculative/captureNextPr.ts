import { getDataSource, ProposedCapabilityError } from '../../api/dataSource'
import { mockArmCaptureNextPr, mockDisarmCaptureNextPr, mockGetCaptureNextPrState, mockSimulateNextEligiblePullRequest } from '../../api/mockBackend'
import type { AnalysisRunSummaryResponse } from '../../control-plane/types'

/**
 * PROPUESTA — HU49, sin forma de contrato aprobada en INTEROP (depende de
 * HU48, que ya tiene contrato definido pero ningún adapter live todavía).
 * Ver spec/features/014-analysisrun-experiments/spec.md. Mecanismo one-shot
 * para demo: `ARMED` espera "el próximo AnalysisRun elegible", pero no hay
 * un webhook real que lo dispare — el mock expone `simulateNextEligiblePullRequest`
 * como disparador explícito de demo en vez de esperar pasivamente, documentado
 * como simplificación deliberada.
 */
export type CaptureNextPrStatus = 'OFF' | 'ARMED'

export interface CaptureNextPrState {
  projectId: string
  status: CaptureNextPrStatus
  armedAt: string | null
}

export function getCaptureNextPrState(projectId: string): Promise<CaptureNextPrState> {
  if (getDataSource() === 'mock') return mockGetCaptureNextPrState(projectId)
  return Promise.reject(new ProposedCapabilityError('Capture next PR (HU49)'))
}

export function armCaptureNextPr(projectId: string): Promise<CaptureNextPrState> {
  if (getDataSource() === 'mock') return mockArmCaptureNextPr(projectId)
  return Promise.reject(new ProposedCapabilityError('Capture next PR (HU49)'))
}

export function disarmCaptureNextPr(projectId: string): Promise<CaptureNextPrState> {
  if (getDataSource() === 'mock') return mockDisarmCaptureNextPr(projectId)
  return Promise.reject(new ProposedCapabilityError('Capture next PR (HU49)'))
}

/** Demo-only: dispara la llegada fabricada del "próximo PR elegible" mientras está `ARMED`. */
export function simulateNextEligiblePullRequest(projectId: string): Promise<AnalysisRunSummaryResponse> {
  if (getDataSource() === 'mock') return mockSimulateNextEligiblePullRequest(projectId)
  return Promise.reject(new ProposedCapabilityError('Capture next PR (HU49)'))
}
