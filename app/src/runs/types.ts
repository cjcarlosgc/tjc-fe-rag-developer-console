export type RunStatus = 'PENDING' | 'GENERATING' | 'VALIDATING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
export type TargetStatus = 'PENDING' | 'GENERATING' | 'VALIDATING' | 'VALID' | 'INVALID' | 'FAILED' | 'SKIPPED'
export type FailureType = 'NONE' | 'COMPILATION' | 'TEST_ASSERTION' | 'TEST_RUNTIME' | 'DEPENDENCY' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'UNKNOWN'

export interface TargetRunViewModel {
  id: string
  label: string
  filePath: string
  status: TargetStatus
  compiled?: boolean
  executed?: boolean
  passed?: boolean
  valid?: boolean
  failureType?: FailureType
  errorSummary?: string
  errorDetail?: string
}

/** `failureMessage` solo aparece si el run entero falló antes de resolver ningún target (p. ej. snapshot no disponible). */
export interface RunViewModel { id: string; status: RunStatus; processed: number; total: number; targets: TargetRunViewModel[]; failureMessage?: string }

export const isTerminalRunStatus = (status: RunStatus) => status === 'COMPLETED' || status === 'PARTIAL' || status === 'FAILED'

export const canRetryTarget = (run: RunViewModel, target: TargetRunViewModel) =>
  isTerminalRunStatus(run.status) && (target.status === 'INVALID' || target.status === 'FAILED')

export type GenerationMode = 'TARGET' | 'CLASS_ALL' | 'CLASS_MISSING' | 'PROJECT_MISSING' | 'PROJECT_ALL'

/** HU20 — resumen de un run en el historial de una ProjectVersion (`TestRunSummaryResponse`). */
export interface TestRunSummary {
  id: string
  mode: GenerationMode
  status: RunStatus
  totalTargets: number | null
  validTargets: number
  invalidTargets: number
  failedTargets: number
  createdAt: string
  completedAt: string | null
}

export interface TestRunHistoryPage {
  items: TestRunSummary[]
  nextCursor: string | null
}

/** HU24 — respuesta de `POST /test-runs/{runId}/targets/{targetId}/retry`. */
export interface TargetRetryAccepted {
  testRunId: string
  targetId: string
  status: 'PENDING'
  pollAfterMs: number
}
