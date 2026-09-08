import type { FailureType, RunStatus, RunViewModel, TargetRunViewModel, TargetStatus } from './types'

/**
 * `TestRunStatusResponse`/`TestRunResultsResponse` (INTEROP-1.5) traen más granularidad y
 * separación (status vs. resultados por target) que `RunViewModel`. Este módulo combina
 * ambas respuestas live en el mismo view model que ya usa el adapter mock, para que
 * `RunPage`/`RunProgress`/`ValidationResults` no necesiten distinguir el origen de los datos.
 */

type CoreTestRunStatus =
  | 'PENDING' | 'RESOLVING_TARGETS' | 'PROCESSING_TARGETS'
  | 'BATCH_VALIDATING' | 'FINALIZING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'

export interface TestRunStatusResponse {
  id: string
  projectId: string
  projectVersionId: string
  mode: string
  status: CoreTestRunStatus
  totalTargets: number | null
  processedTargets: number
  validTargets: number
  invalidTargets: number
  failedTargets: number
  reason: string | null
  failureCode: string | null
  failureMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ValidationResponse {
  compiled: boolean
  executed: boolean
  passed: boolean
  valid: boolean
  failureType: FailureType
  errorSummary: string | null
  evidenceIds: string[]
}

interface TargetRunResultResponse {
  targetId: string
  filePath: string
  symbolName: string
  methodName: string | null
  targetType: string
  status: TargetStatus
  artifactIds: string[]
  validation: ValidationResponse | null
}

export interface TestRunResultsResponse {
  id: string
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED'
  totalTargets: number
  validTargets: number
  invalidTargets: number
  failedTargets: number
  targets: TargetRunResultResponse[]
  completedAt: string
}

const statusMap: Record<CoreTestRunStatus, RunStatus> = {
  PENDING: 'PENDING',
  RESOLVING_TARGETS: 'GENERATING',
  PROCESSING_TARGETS: 'GENERATING',
  BATCH_VALIDATING: 'VALIDATING',
  FINALIZING: 'VALIDATING',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
}

export function isTerminalCoreStatus(status: CoreTestRunStatus): boolean {
  return status === 'COMPLETED' || status === 'PARTIAL' || status === 'FAILED'
}

function toTargetViewModel(target: TargetRunResultResponse): TargetRunViewModel {
  return {
    id: target.targetId,
    label: target.methodName ?? target.symbolName,
    filePath: target.filePath,
    status: target.status,
    compiled: target.validation?.compiled,
    executed: target.validation?.executed,
    passed: target.validation?.passed,
    valid: target.validation?.valid,
    failureType: target.validation?.failureType,
    errorSummary: target.validation?.errorSummary ?? undefined,
  }
}

export function toRunViewModel(status: TestRunStatusResponse, results: TestRunResultsResponse | null): RunViewModel {
  const targets = results ? results.targets.map(toTargetViewModel) : []
  return {
    id: status.id,
    status: statusMap[status.status],
    processed: status.processedTargets,
    total: status.totalTargets ?? results?.totalTargets ?? 0,
    targets,
    // El run puede fallar antes de resolver ningún target (p. ej. snapshot no disponible);
    // en ese caso `targets` queda vacío y la única explicación disponible es este mensaje.
    failureMessage: targets.length === 0 && status.failureMessage ? status.failureMessage : undefined,
  }
}
