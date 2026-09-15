import type { ExperimentResultViewModel } from '../experiments/types'

/**
 * PROPUESTA — HU48, sin forma de contrato aprobada en INTEROP. Ver
 * spec/features/014-analysisrun-experiments/spec.md (PROPOSED) y
 * harness/reports/console-backlog-formalization.md. Puede requerir
 * rediseño cuando Core apruebe una forma real de `AnalysisRun`↔`ExperimentRun`.
 * `ExperimentResultViewModel` sí se reusa tal cual (ya es un view-model
 * propio del frontend, no un espejo de contrato — ver liveMapping.ts).
 */
export type RunComparisonStatus = 'PENDING' | 'RUNNING' | 'COMPLETED'

export interface RunComparisonAccepted {
  comparisonId: string
  status: 'PENDING'
  pollAfterMs: number
}

export interface RunComparisonOperation {
  id: string
  analysisRunId: string
  projectId: string
  status: RunComparisonStatus
  progress: number
  result?: ExperimentResultViewModel
}
