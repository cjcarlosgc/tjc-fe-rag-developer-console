export type RunStatus = 'PENDING' | 'GENERATING' | 'VALIDATING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
export type TargetStatus = 'PENDING' | 'GENERATING' | 'VALIDATING' | 'VALID' | 'INVALID' | 'FAILED'
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

export interface RunViewModel { id: string; status: RunStatus; processed: number; total: number; targets: TargetRunViewModel[] }

export const isTerminalRunStatus = (status: RunStatus) => status === 'COMPLETED' || status === 'PARTIAL' || status === 'FAILED'
