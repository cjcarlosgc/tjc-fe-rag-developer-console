import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { PendingContractError, setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend, setMockAnalysisRunForTests } from '../api/mockBackend'
import { shouldRetryEvidence, useEvidence, EVIDENCE_NOT_FINISHED_MAX_RETRIES } from './queries'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => setDataSourceForTests(null))

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
}

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

describe('useEvidence', () => {
  it('409 no es un fallo definitivo: reintenta hasta que el sujeto termina y entrega el bundle', async () => {
    setMockAnalysisRunForTests('arun_checkout_pr45', { status: 'PROCESSING' })
    const { result } = renderHook(() => useEvidence('ANALYSIS_RUN', 'arun_checkout_pr45', true), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isFetching).toBe(true))
    setMockAnalysisRunForTests('arun_checkout_pr45', { status: 'SUCCESS' })
    await waitFor(() => expect(result.current.data?.bundle.kind).toBe('ANALYSIS_RUN'), { timeout: 3000 })
    expect(result.current.isError).toBe(false)
  })

  it('404 queda como error sin reintentos', async () => {
    const { result } = renderHook(() => useEvidence('ANALYSIS_RUN', 'arun_inexistente', true), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.error).toMatchObject({ status: 404 }))
  })

  it('no consulta mientras enabled es false', async () => {
    const { result } = renderHook(() => useEvidence('ANALYSIS_RUN', 'arun_checkout_pr45', false), { wrapper: wrapper() })
    await act(async () => { await Promise.resolve() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
