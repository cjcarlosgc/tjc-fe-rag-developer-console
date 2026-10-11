import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { PendingContractError, setDataSourceForTests } from '../api/dataSource'
import { mockCreateTestPublication, mockDeleteProject, mockGetAnalysisRunTrace, resetMockBackend, setMockAnalysisRunForTests } from '../api/mockBackend'
import { listFunctionalKnowledge } from '../action-required/api'
import { getAnalysisRunTrace } from './api'
import { isTraceNotFinished, shouldRetryOperationalTrace } from './operationalTraceErrors'
import { useAnalysisRunTrace } from './queries'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => setDataSourceForTests(null))

async function expectApiError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(status)
  expect((error as ApiError).code).toBe(code)
  return error as ApiError
}

describe('trace operativo (INTEROP-2.7 §6.16)', () => {
  it('SUCCESS: varios targets con los nueve enlaces PRESENT y el changeset con su conteo', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr45')

    expect(trace).toMatchObject({
      analysisRunId: 'arun_checkout_pr45',
      repositoryName: 'acme/checkout-service',
      pullRequestNumber: 45,
      headSha: 'e5e5e5e',
      changeset: { status: 'PRESENT', targetCount: 2 },
      publication: { status: 'NOT_APPLICABLE', checkId: null, companionBranch: null, companionPullRequestUrl: null, sourceHeadSha: null, freshness: null },
    })
    expect(trace.targets).toHaveLength(2)
    const [total, money] = trace.targets
    expect(total.symbol.qualifiedName).toBe('OrderService.calculateTotal')
    expect(total.retrieval).toEqual({ status: 'PRESENT', retrievalId: 'ret_demo_pr45_total' })
    expect(total.context).toEqual({ status: 'PRESENT', contextId: 'ctx_demo_pr45_total', functionalRuleIds: ['fk_rounding_v2'] })
    expect(total.generation).toEqual({ status: 'PRESENT', proposalIds: ['prop_pr45_1', 'prop_pr45_2'] })
    expect(total.executions.status).toBe('PRESENT')
    expect(total.executions.items.map((item) => item.executionId)).toEqual(['exec_demo_pr45_1', 'exec_demo_pr45_2'])
    expect(money.executions.items[0]).toMatchObject({ executionId: 'exec_demo_pr45_3', attempt: 2, outcome: 'SUCCESS' })
  })

  it('BEHAVIORAL_MISMATCH conserva la traza de ejecución con su outcome tal cual', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr46')
    expect(trace.targets).toHaveLength(1)
    expect(trace.targets[0].executions.items).toEqual([
      { executionId: 'exec_demo_pr46_1', proposalId: 'prop_pr46_1', attempt: 1, executionProfile: 'demo-sandbox-node', outcome: 'BEHAVIORAL_MISMATCH' },
    ])
    expect(trace.targets[0].context.functionalRuleIds).toEqual(['fk_coupon_expiry'])
  })

  it('outcome usa solo el vocabulario implementado de §6.16 en todos los fixtures demo', async () => {
    const allowed = new Set(['SUCCESS', 'BEHAVIORAL_MISMATCH', 'TECHNICAL_GENERATION_FAILURE'])
    for (const id of ['arun_checkout_pr45', 'arun_checkout_pr46', 'arun_checkout_pr47', 'arun_checkout_pr42', 'arun_billing_pr22']) {
      const trace = await getAnalysisRunTrace(id)
      for (const target of trace.targets) for (const item of target.executions.items) expect(allowed.has(item.outcome)).toBe(true)
    }
  })

  it('§6.16 orden determinista: targets por filePath y qualifiedName; ejecuciones por attempt, en todos los fixtures', async () => {
    for (const id of ['arun_checkout_pr45', 'arun_checkout_pr46', 'arun_checkout_pr47', 'arun_checkout_pr42', 'arun_billing_pr22']) {
      const trace = await getAnalysisRunTrace(id)
      const keys = trace.targets.map((target) => [target.symbol.filePath, target.symbol.qualifiedName])
      expect(keys).toEqual([...keys].sort(([fa, qa], [fb, qb]) => (fa === fb ? (qa < qb ? -1 : qa > qb ? 1 : 0) : fa < fb ? -1 : 1)))
      for (const target of trace.targets) {
        const attempts = target.executions.items.map((item) => item.attempt)
        expect(attempts).toEqual([...attempts].sort((a, b) => a - b))
      }
    }
  })

  it('ACTION_REQUIRED (pr42): el primer target es CouponPolicy.apply por filePath', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr42')
    expect(trace.targets.map((target) => target.symbol.qualifiedName)).toEqual(['CouponPolicy.apply', 'OrderService.calculateTotal'])
  })

  it('publicación solo con Check (pr47): PRESENT con checkId null, rama y PR null, freshness null', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr47')
    expect(trace.publication).toEqual({ status: 'PRESENT', checkId: null, companionBranch: null, companionPullRequestUrl: null, sourceHeadSha: null, freshness: null })
  })

  it('NO_ADDITIONAL_TESTS_REQUIRED: generación y ejecuciones NOT_APPLICABLE con retrieval y contexto presentes', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr47')
    expect(trace.targets[0].retrieval.status).toBe('PRESENT')
    expect(trace.targets[0].context.status).toBe('PRESENT')
    expect(trace.targets[0].generation).toEqual({ status: 'NOT_APPLICABLE', proposalIds: [] })
    expect(trace.targets[0].executions).toEqual({ status: 'NOT_APPLICABLE', items: [] })
  })

  it('ACTION_REQUIRED: los enlaces posteriores constan NOT_APPLICABLE sin filas inventadas', async () => {
    const trace = await getAnalysisRunTrace('arun_checkout_pr42')
    expect(trace.changeset).toEqual({ status: 'PRESENT', targetCount: 2 })
    expect(trace.targets).toHaveLength(2)
    for (const target of trace.targets) {
      expect(target.retrieval).toEqual({ status: 'NOT_APPLICABLE', retrievalId: null })
      expect(target.context).toEqual({ status: 'NOT_APPLICABLE', contextId: null, functionalRuleIds: [] })
      expect(target.generation).toEqual({ status: 'NOT_APPLICABLE', proposalIds: [] })
      expect(target.executions).toEqual({ status: 'NOT_APPLICABLE', items: [] })
    }
  })

  it('Run sin targets (NO_TEST_RELEVANT_CHANGES): changeset con targetCount 0 y sin targets', async () => {
    const trace = await getAnalysisRunTrace('arun_billing_pr22')
    expect(trace.changeset).toEqual({ status: 'PRESENT', targetCount: 0 })
    expect(trace.targets).toEqual([])
  })

  it('publicación: NOT_APPLICABLE sin publicar y PRESENT con freshness CURRENT tras publicar', async () => {
    expect((await getAnalysisRunTrace('arun_checkout_pr45')).publication.status).toBe('NOT_APPLICABLE')

    await mockCreateTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    const published = (await getAnalysisRunTrace('arun_checkout_pr45')).publication
    expect(published).toMatchObject({
      status: 'PRESENT',
      checkId: null,
      sourceHeadSha: 'e5e5e5e',
      freshness: 'CURRENT',
    })
    expect(published.companionBranch).toBe('rag-tests/pr-45-e5e5e5e')
    expect(published.companionPullRequestUrl).toBe('https://github.com/acme/checkout-service/pull/145')
  })

  it('publicación STALE cuando el HEAD del PR cambió después de publicar', async () => {
    await mockCreateTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    setMockAnalysisRunForTests('arun_checkout_pr45', { headSha: 'e6e6e6e' })
    expect((await getAnalysisRunTrace('arun_checkout_pr45')).publication.freshness).toBe('STALE')
  })

  it('404 genérico con ANALYSIS_RUN_NOT_FOUND para un Run inexistente', async () => {
    await expectApiError(mockGetAnalysisRunTrace('arun_no_existe'), 404, 'ANALYSIS_RUN_NOT_FOUND')
  })

  it('409 EVIDENCE_NOT_FINISHED para QUEUED y PROCESSING, distinto de CONTEXT_TRACE_NOT_FINISHED', async () => {
    const queued = await expectApiError(getAnalysisRunTrace('arun_checkout_pr53'), 409, 'EVIDENCE_NOT_FINISHED')
    const processing = await expectApiError(getAnalysisRunTrace('arun_billing_pr25'), 409, 'EVIDENCE_NOT_FINISHED')
    expect(isTraceNotFinished(queued)).toBe(true)
    expect(isTraceNotFinished(processing)).toBe(true)
    expect(isTraceNotFinished(new ApiError('x', 409, undefined, 'CONTEXT_TRACE_NOT_FINISHED'))).toBe(false)
    expect(isTraceNotFinished(new ApiError('x', 404, undefined, 'EVIDENCE_NOT_FINISHED'))).toBe(false)
  })

  it('un Run que pasa a terminal deja de responder 409', async () => {
    await expectApiError(getAnalysisRunTrace('arun_checkout_pr53'), 409, 'EVIDENCE_NOT_FINISHED')
    setMockAnalysisRunForTests('arun_checkout_pr53', { status: 'NO_TEST_RELEVANT_CHANGES' })
    const trace = await getAnalysisRunTrace('arun_checkout_pr53')
    expect(trace.targets).toEqual([])
  })

  it('live consume GET /analysis-runs/{id}/trace', async () => {
    setDataSourceForTests('live')
    const trace = { analysisRunId: 'arun_checkout_pr45', repositoryName: 'acme/repo', pullRequestNumber: 1, headSha: 'abc', changeset: { status: 'PRESENT', targetCount: 0 }, targets: [], publication: { status: 'NOT_APPLICABLE', checkId: null, companionBranch: null, companionPullRequestUrl: null, sourceHeadSha: null, freshness: null } }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(trace), { status: 200 }))
    await expect(getAnalysisRunTrace('arun_checkout_pr45')).resolves.toEqual(trace)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/analysis-runs/arun_checkout_pr45/trace'), expect.anything())
  })

  it('reglas FK: ids existentes aparecen en listados de conocimiento; el id ausente no', async () => {
    const knowledge = await listFunctionalKnowledge('prj_checkout_demo')
    const ids = new Set(knowledge.items.map((item) => item.id))
    const trace = await getAnalysisRunTrace('arun_checkout_pr45')
    const rules = trace.targets.flatMap((target) => target.context.functionalRuleIds)
    expect(rules.filter((id) => ids.has(id))).toEqual(['fk_rounding_v2'])
    expect(rules.filter((id) => !ids.has(id))).toEqual(['fk_demo_regla_inexistente'])
  })

  it('visibilidad: la traza de un Run de un Project borrado responde 404 genérico', async () => {
    await expect(getAnalysisRunTrace('arun_billing_pr22')).resolves.toMatchObject({ analysisRunId: 'arun_billing_pr22' })
    await mockDeleteProject('prj_billing_demo')
    await expectApiError(getAnalysisRunTrace('arun_billing_pr22'), 404, 'ANALYSIS_RUN_NOT_FOUND')
  })
})

describe('shouldRetryOperationalTrace', () => {
  it('no reintenta 404, 409 ni contrato pendiente, y sí reintenta errores transitorios hasta dos veces', () => {
    expect(shouldRetryOperationalTrace(0, new ApiError('x', 404, undefined, 'ANALYSIS_RUN_NOT_FOUND'))).toBe(false)
    expect(shouldRetryOperationalTrace(0, new ApiError('x', 409, undefined, 'EVIDENCE_NOT_FINISHED'))).toBe(false)
    expect(shouldRetryOperationalTrace(0, new PendingContractError('trace'))).toBe(false)
    expect(shouldRetryOperationalTrace(0, new ApiError('x', 503))).toBe(true)
    expect(shouldRetryOperationalTrace(2, new ApiError('x', 503))).toBe(false)
  })
})

describe('useAnalysisRunTrace', () => {
  function wrapper() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
  }

  it('sigue por polling mientras el Run está en PROCESSING y entrega la traza al terminar', async () => {
    const { result } = renderHook(() => useAnalysisRunTrace('arun_checkout_pr53'), { wrapper: wrapper() })

    await waitFor(() => expect(isTraceNotFinished(result.current.error)).toBe(true))
    expect(result.current.data).toBeUndefined()

    act(() => setMockAnalysisRunForTests('arun_checkout_pr53', { status: 'NO_TEST_RELEVANT_CHANGES' }))

    await waitFor(() => expect(result.current.data?.analysisRunId).toBe('arun_checkout_pr53'))
    expect(result.current.error).toBeNull()
  })

  it('se detiene ante 404 sin seguir consultando', async () => {
    const { result } = renderHook(() => useAnalysisRunTrace('arun_no_existe'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError))
    expect((result.current.error as ApiError).status).toBe(404)
    expect(isTraceNotFinished(result.current.error)).toBe(false)
  })
})
