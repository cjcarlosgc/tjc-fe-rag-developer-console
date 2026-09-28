import { afterEach, describe, expect, it } from 'vitest'
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

describe('context-explorer api (live, contrato pendiente en RAG Core)', () => {
  it('rechaza con PendingContractError en las funciones aún no publicadas por Core', async () => {
    setDataSourceForTests('live')
    await expect(listExperimentContextTraces('exp-1')).rejects.toThrow(/RAG Core/)
    await expect(getContextTrace('trace-1')).rejects.toThrow(/RAG Core/)
    await expect(listDiscoveredFiles('trace-1', 1)).rejects.toThrow(/RAG Core/)
    await expect(getAnalysisRunContextTrace('arun-1')).rejects.toThrow(/RAG Core/)
  })
})
