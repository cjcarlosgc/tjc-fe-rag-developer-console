import { afterEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockStartExperiment, resetMockBackend } from '../api/mockBackend'
import { getAnalysisRunContextTrace, getContextTrace, listDiscoveredFiles, listExperimentContextTraces } from './api'

afterEach(() => setDataSourceForTests(null))

describe('context-explorer api (mock)', () => {
  it('lista las seis trazas asociadas a las repeticiones de un experimento', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    const page = await listExperimentContextTraces(accepted.experimentId)
    expect(page.items).toHaveLength(6)
    expect(page.items.every((item) => item.experimentId === accepted.experimentId)).toBe(true)
  })

  it('getContextTrace devuelve el DTO RAG completo para una repetición', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    const detail = await getContextTrace(`${accepted.experimentId}-rag-r1`)
    expect(detail.kind).toBe('RAG')
    if (detail.kind !== 'RAG') throw new Error('expected RAG')
    expect(detail.strategy).toBe('RAG')
    expect(detail.candidates.some((candidate) => candidate.decision === 'SELECTED')).toBe(true)
  })

  it('getContextTrace responde 404 para un id inexistente', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    await expect(getContextTrace('trace_does_not_exist')).rejects.toMatchObject({ status: 404, code: 'CONTEXT_TRACE_NOT_FOUND' })
  })

  it('getAnalysisRunContextTrace devuelve la traza RAG asociada a PR#45', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const trace = await getAnalysisRunContextTrace('arun_checkout_pr45')
    expect(trace?.kind).toBe('RAG')
    expect(trace?.target.excerpt.symbolName).toBe('calculateTotal')
    expect(trace?.testRunId).toBeNull()
    expect(trace?.artifactIds).toEqual([])
  })

  it('getAnalysisRunContextTrace devuelve null cuando el Run no tiene traza disponible', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    await expect(getAnalysisRunContextTrace('arun_billing_pr17')).resolves.toBeNull()
  })

  it('lista los archivos descubiertos en un paso list_files', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    const page = await listDiscoveredFiles(`${accepted.experimentId}-agent-r1`, 1)
    expect(page.items.length).toBeGreaterThan(0)
  })
})

describe('context-explorer api (live)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('consulta las rutas publicadas por Core para trazas de un experimento', async () => {
    setDataSourceForTests('live')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 }))
    await expect(listExperimentContextTraces('exp-1', { strategy: 'RAG', repetition: 2 })).resolves.toEqual({ items: [], nextCursor: null })
    await getContextTrace('trace-1')
    await listDiscoveredFiles('trace-1', 3)
    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls[0]).toContain('/experiments/exp-1/context-traces?strategy=RAG&repetition=2')
    expect(urls[1]).toContain('/context-traces/trace-1')
    expect(urls[2]).toContain('/context-traces/trace-1/discovered-files?step=3')
  })

  it('el contexto de un AnalysisRun sigue pendiente de contrato en Core', async () => {
    setDataSourceForTests('live')
    await expect(getAnalysisRunContextTrace('arun-1')).rejects.toThrow(/RAG Core/)
  })
})

describe('context-explorer mock · capas y estrategia (WI-CONSOLE-052)', () => {
  it('la traza RAG demo trae capas en SELECTED, estrategia LAYERED y un descarte BELOW_RELEVANCE_THRESHOLD', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const trace = await getContextTrace('trace_rag_order_total')
    if (trace.kind !== 'RAG') throw new Error('expected RAG')
    const selected = trace.candidates.filter((candidate) => candidate.decision === 'SELECTED')
    expect(selected.some((candidate) => candidate.layer === 'DECLARING_CLASS')).toBe(true)
    expect(selected.some((candidate) => candidate.layer === 'TARGET_EVIDENCE' || candidate.layer === 'RELEVANT_SEMANTIC')).toBe(true)
    expect(trace.candidates.some((candidate) => candidate.discardReason === 'BELOW_RELEVANCE_THRESHOLD')).toBe(true)
    expect(trace.configuration.strategy).toBe('LAYERED')
    expect(trace.selectedChunks).toBe(selected.length)
    expect(trace.contextTokens).toBe(selected.reduce((total, candidate) => total + candidate.tokenCount, 0))
  })

  it('las trazas RAG del experimento demo no llevan capas ni estrategia (ausencia de campos opcionales)', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    const trace = await getContextTrace(`${accepted.experimentId}-rag-r1`)
    if (trace.kind !== 'RAG') throw new Error('expected RAG')
    expect(trace.candidates.every((candidate) => candidate.layer === undefined)).toBe(true)
    expect(trace.configuration.strategy).toBeUndefined()
  })
})
