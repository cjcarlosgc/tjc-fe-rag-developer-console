import type { AnalysisRunStatus, RepositoryBindingStatus } from './types'

export const ANALYSIS_RUN_STATUS_LABELS: Record<AnalysisRunStatus, string> = {
  QUEUED: 'En cola',
  PROCESSING: 'Procesando',
  ACTION_REQUIRED: 'Action required',
  SUCCESS: 'Success',
  BEHAVIORAL_MISMATCH: 'Behavioral mismatch',
  TECHNICAL_GENERATION_FAILURE: 'Technical generation failure',
  INFRASTRUCTURE_FAILURE: 'Infrastructure failure',
  BASELINE_FAILED: 'Baseline failed',
  NO_ADDITIONAL_TESTS_REQUIRED: 'Existing tests sufficient',
  NO_TEST_RELEVANT_CHANGES: 'No relevant changes',
  OBSOLETE: 'Obsolete (HEAD nuevo)',
}

/** Semántica de color reforzada en sdd-1.16: `--success` = validado/completado, `--danger` = falla de plataforma, ámbar = necesita revisión humana (no es una falla). */
export function analysisRunStatusClass(status: AnalysisRunStatus): string {
  switch (status) {
    case 'SUCCESS':
    case 'NO_ADDITIONAL_TESTS_REQUIRED':
    case 'NO_TEST_RELEVANT_CHANGES':
      return 'status-success'
    case 'BASELINE_FAILED':
    case 'TECHNICAL_GENERATION_FAILURE':
    case 'INFRASTRUCTURE_FAILURE':
      return 'status-danger'
    case 'ACTION_REQUIRED':
    case 'BEHAVIORAL_MISMATCH':
      return 'status-warn'
    case 'OBSOLETE':
      return 'status-muted'
    default:
      return ''
  }
}

/** Un binding `DISABLED` es una pausa reversible (ámbar); `REVOKED` es pérdida de acceso de la GitHub App (falla, rojo). */
export const BINDING_STATUS_BADGES: Record<RepositoryBindingStatus, { label: string; className: string }> = {
  ENABLED: { label: 'Activo', className: 'status-success' },
  DISABLED: { label: 'Pausado', className: 'status-warn' },
  REVOKED: { label: 'Revocado', className: 'status-danger' },
}
