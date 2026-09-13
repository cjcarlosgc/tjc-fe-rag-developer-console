import { afterEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { getAnalysisRunContextTrace, getContextTrace, listDiscoveredFiles, listExperimentContextTraces, listRunContextTraces } from './api'

afterEach(() => setDataSourceForTests(null))

describe('context-explorer api (mock)', () => {
  it('sin filtros devuelve la traza vigente de cada target del run', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const page = await listRunContextTraces('run_checkout_seed')
    expect(page.items).toHaveLength(2)
    expect(page.items.every((item) => item.current)).toBe(true)
  })

  it('includeSuperseded incorpora intentos anteriores conservados por retry', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const page = await listRunContextTraces('run_checkout_seed', { includeSuperseded: true })
    expect(page.items.length).toBeGreaterThan(2)
    expect(page.items.some((item) => !item.current)).toBe(true)
  })

  it('filtra por artifactId', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const page = await listRunContextTraces('run_checkout_seed', { artifactId: 'run_checkout_seed-artifact-1' })
    expect(page.items).toHaveLength(1)
    expect(page.items[0].artifactIds).toContain('run_checkout_seed-artifact-1')
  })

  it('getContextTrace devuelve el DTO RAG completo con match dual y las 3 razones de descarte', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const detail = await getContextTrace('trace_rag_order_total')
    expect(detail.kind).toBe('RAG')
    if (detail.kind !== 'RAG') throw new Error('expected RAG')
    const discardReasons = new Set(detail.candidates.filter((candidate) => candidate.decision === 'DISCARDED').map((candidate) => candidate.discardReason))
    expect(discardReasons).toEqual(new Set(['BELOW_MINIMUM_SCORE', 'TOP_K_LIMIT', 'TOKEN_BUDGET']))
    expect(detail.candidates.some((candidate) => candidate.matchedVia.includes('SEMANTIC') && candidate.structuralMatch !== null)).toBe(true)
    expect(detail.candidates.some((candidate) => candidate.matchedVia.length === 1 && candidate.matchedVia[0] === 'SEMANTIC' && candidate.structuralMatch === null)).toBe(true)
    expect(detail.candidates.every((candidate) => candidate.decision === 'SELECTED' ? candidate.discardReason === null : candidate.discardReason !== null)).toBe(true)
  })

  it('getContextTrace responde 409 transitorio y luego resuelve el detalle', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    await expect(getContextTrace('trace_rag_coupon')).rejects.toMatchObject({ status: 409, code: 'CONTEXT_TRACE_NOT_FINISHED' })
    await expect(getContextTrace('trace_rag_coupon')).rejects.toMatchObject({ status: 409, code: 'CONTEXT_TRACE_NOT_FINISHED' })
    const detail = await getContextTrace('trace_rag_coupon')
    expect(detail.kind).toBe('RAG')
  })

  it('getContextTrace responde 404 para un id inexistente', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    await expect(getContextTrace('trace_does_not_exist')).rejects.toMatchObject({ status: 404, code: 'CONTEXT_TRACE_NOT_FOUND' })
  })

  it('getAnalysisRunContextTrace devuelve la traza RAG mapeada para PR#45 (mismo target: calculateTotal)', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const trace = await getAnalysisRunContextTrace('arun_checkout_pr45')
    expect(trace?.kind).toBe('RAG')
    expect(trace?.target.excerpt.symbolName).toBe('calculateTotal')
  })

  it('getAnalysisRunContextTrace devuelve null cuando el Run no tiene traza mockeada', async () => {
    setDataSourceForTests('mock')
    resetMockBackend()
    const trace = await getAnalysisRunContextTrace('arun_billing_pr17')
    expect(trace).toBeNull()
  })
})

describe('context-explorer api (live, contrato pendiente en RAG Core)', () => {
  it('rechaza con PendingContractError en las 5 funciones', async () => {
    setDataSourceForTests('live')
    await expect(listRunContextTraces('run-1')).rejects.toThrow(/RAG Core/)
    await expect(listExperimentContextTraces('exp-1')).rejects.toThrow(/RAG Core/)
    await expect(getContextTrace('trace-1')).rejects.toThrow(/RAG Core/)
    await expect(listDiscoveredFiles('trace-1', 1)).rejects.toThrow(/RAG Core/)
    await expect(getAnalysisRunContextTrace('arun-1')).rejects.toThrow(/RAG Core/)
  })
})
