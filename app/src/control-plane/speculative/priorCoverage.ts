import { getDataSource, ProposedCapabilityError } from '../../api/dataSource'
import { mockGetPriorCoverage } from '../../api/mockBackend'

/**
 * PROPUESTA — HU50, sin forma de contrato aprobada en INTEROP. Ver
 * spec/features/013-pr-driven-control-plane/spec.md (PROPOSED) y
 * harness/reports/console-backlog-formalization.md.
 * `AnalysisRunDetailResponse` no expone cobertura previa por símbolo hoy.
 */
export type PriorCoverageLevel = 'NONE' | 'PARTIAL' | 'SUFFICIENT'

export const PRIOR_COVERAGE_LABELS: Record<PriorCoverageLevel, string> = {
  NONE: 'sin cobertura previa',
  PARTIAL: 'cobertura previa parcial',
  SUFFICIENT: 'cobertura previa suficiente',
}

export function getPriorCoverage(analysisRunId: string): Promise<Record<string, PriorCoverageLevel>> {
  if (getDataSource() === 'mock') return mockGetPriorCoverage(analysisRunId)
  return Promise.reject(new ProposedCapabilityError('Cobertura previa (HU50)'))
}
