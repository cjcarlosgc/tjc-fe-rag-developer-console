import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { PendingContractError } from '../api/dataSource'
import { shouldRetryEvidence, EVIDENCE_NOT_FINISHED_MAX_RETRIES } from './queries'

describe('shouldRetryEvidence', () => {
  it('reintenta 409 EVIDENCE_NOT_FINISHED de forma acotada', () => {
    const notFinished = new ApiError('x', 409, undefined, 'EVIDENCE_NOT_FINISHED')
    expect(shouldRetryEvidence(0, notFinished)).toBe(true)
    expect(shouldRetryEvidence(EVIDENCE_NOT_FINISHED_MAX_RETRIES, notFinished)).toBe(false)
  })

  it('no reintenta 404, 403, 409 de otro código ni contrato pendiente', () => {
    expect(shouldRetryEvidence(0, new ApiError('x', 404, undefined, 'ANALYSIS_RUN_NOT_FOUND'))).toBe(false)
    expect(shouldRetryEvidence(0, new ApiError('x', 403, undefined, 'PROJECT_ROLE_INSUFFICIENT'))).toBe(false)
    expect(shouldRetryEvidence(0, new ApiError('x', 409, undefined, 'OTRO'))).toBe(false)
    expect(shouldRetryEvidence(0, new PendingContractError('evidencia'))).toBe(false)
  })
})
