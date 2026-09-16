import { getDataSource, ProposedCapabilityError } from '../../api/dataSource'
import { mockGetRuleUsage } from '../../api/mockBackend'
import type { AnalysisRunSummaryResponse } from '../../control-plane/types'

/**
 * PROPUESTA — HU52, sin forma de contrato aprobada en INTEROP. Ver
 * spec/features/013-pr-driven-control-plane/spec.md (PROPOSED) y
 * harness/reports/console-backlog-formalization.md.
 * `FunctionalKnowledgeResponse` no expone hoy qué `AnalysisRun` usaron la
 * regla; el mock la infiere localmente por símbolo == `targetRef` dentro del
 * mismo proyecto, sin distinguir qué versión de la regla estaba `ACTIVE` en
 * el momento de cada Run.
 */
export type RuleUsageRef = AnalysisRunSummaryResponse

export function getRuleUsage(knowledgeId: string): Promise<RuleUsageRef[]> {
  if (getDataSource() === 'mock') return mockGetRuleUsage(knowledgeId)
  return Promise.reject(new ProposedCapabilityError('Trazabilidad de uso — Runs que usaron esta regla (HU52)'))
}
