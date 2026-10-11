import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { mockStartExperiment, mockGetExperiment, mockGetRetrievalComparison, resetMockBackend, setMockAnalysisRunForTests, mockGetEvidence } from '../api/mockBackend'
import { getEvidence } from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => setDataSourceForTests(null))

async function errorOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(() => null, (caught: unknown) => caught)
}

describe('getEvidence (modo mock)', () => {
  it('ANALYSIS_RUN terminal: devuelve bundle de schemaVersion 1 y raw igual a la serialización del bundle', async () => {
    const { raw, bundle } = await getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45')
    expect(bundle).toMatchObject({ schemaVersion: '1', kind: 'ANALYSIS_RUN', subjectId: 'arun_checkout_pr45' })
    expect(bundle.analysisRun?.analysisRunId).toBe('arun_checkout_pr45')
    expect(raw).toBe(JSON.stringify(bundle, null, 2))
    expect(JSON.parse(raw)).toEqual(bundle)
  })

  it('ANALYSIS_RUN en QUEUED/PROCESSING responde 409 EVIDENCE_NOT_FINISHED y, al terminar, sirve el bundle', async () => {
    setMockAnalysisRunForTests('arun_checkout_pr45', { status: 'PROCESSING' })
    const error = await errorOf(getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45'))
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).code).toBe('EVIDENCE_NOT_FINISHED')

    setMockAnalysisRunForTests('arun_checkout_pr45', { status: 'ACTION_REQUIRED' })
    await expect(getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45')).resolves.toMatchObject({ bundle: { kind: 'ANALYSIS_RUN' } })
  })

  it('EXPERIMENT: 409 mientras está PENDING/RUNNING y bundle al COMPLETED', async () => {
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    await expect(mockGetEvidence('EXPERIMENT', accepted.experimentId)).rejects.toMatchObject({ status: 409, code: 'EVIDENCE_NOT_FINISHED' })
    // La evidencia no avanza el experimento: sólo el GET de estado lo hace.
    await mockGetExperiment(accepted.experimentId)
    await mockGetExperiment(accepted.experimentId)
    await mockGetExperiment(accepted.experimentId)
    const { bundle } = await getEvidence('EXPERIMENT', accepted.experimentId)
    expect(bundle).toMatchObject({ schemaVersion: '1', kind: 'EXPERIMENT', subjectId: accepted.experimentId, analysisRun: null })
  })

  it('RETRIEVAL_COMPARISON: 409 en PENDING, bundle en COMPLETED y en FAILED', async () => {
    await expect(mockGetEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_pending')).rejects.toMatchObject({ status: 409, code: 'EVIDENCE_NOT_FINISHED' })
    await mockGetRetrievalComparison('rcmp_demo_seed_pending')
    await mockGetRetrievalComparison('rcmp_demo_seed_pending')
    await mockGetRetrievalComparison('rcmp_demo_seed_pending')
    await expect(getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_pending')).resolves.toMatchObject({ bundle: { kind: 'RETRIEVAL_COMPARISON', schemaVersion: '1' } })
    await expect(getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_failed')).resolves.toMatchObject({ bundle: { kind: 'RETRIEVAL_COMPARISON' } })
    await expect(getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_completed_con_metricas')).resolves.toMatchObject({ bundle: { retrieval: expect.any(Array) } })
  })

  it('404 cuando el sujeto no existe o no es visible', async () => {
    expect(await errorOf(getEvidence('ANALYSIS_RUN', 'arun_inexistente'))).toMatchObject({ status: 404, code: 'ANALYSIS_RUN_NOT_FOUND' })
    expect(await errorOf(getEvidence('EXPERIMENT', 'exp_inexistente'))).toMatchObject({ status: 404 })
    expect(await errorOf(getEvidence('RETRIEVAL_COMPARISON', 'rcmp_inexistente'))).toMatchObject({ status: 404, code: 'RETRIEVAL_COMPARISON_NOT_FOUND' })
  })

  it('ningún bundle mock contiene identificadores EV-OE*', async () => {
    const { raw: analysis } = await getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45')
    const { raw: comparison } = await getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_completed_con_metricas')
    expect(analysis).not.toMatch(/EV-OE/)
    expect(comparison).not.toMatch(/EV-OE/)
  })
})

describe('getEvidence · forma de §6.16 (CS-CORE-20261009-014, WI-CONSOLE-021 corte C2)', () => {
  it('los facts de Sandbox solo usan la allowlist cerrada de §6.16', async () => {
    const { bundle } = await getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45')
    const allowed = new Set(['executionProfile', 'runner', 'compiled', 'executed', 'passed', 'totalTests', 'passedTests', 'failedTests', 'skippedTests', 'testCasesTruncated', 'failureStage', 'failureCategory', 'failureCode', 'failureMessage'])
    for (const entry of bundle.sandbox) expect(Object.keys(entry.facts).every((key) => allowed.has(key))).toBe(true)
  })

  it('corrida previa a OE5 (DEMO legacy): todo dato no observado es null, nunca 0 ni cadena vacía', async () => {
    const accepted = await mockStartExperiment('prj_checkout_demo', 'demo-scenario-legacy')
    await mockGetExperiment(accepted.experimentId)
    const { bundle } = await getEvidence('EXPERIMENT', accepted.experimentId)
    expect(bundle.generation.length).toBeGreaterThan(0)
    expect(bundle.generation.some((row) => row.provider === null && row.model === null)).toBe(true)
    expect(bundle.sandbox.some((row) => row.executionId === null && row.requestId === null && row.durationMs === null && row.correlationId === null)).toBe(true)
    expect(bundle.sandbox.every((row) => row.durationMs !== 0)).toBe(true)
    expect(bundle.experimental.every((row) => typeof row.technicallyEvaluable === 'boolean')).toBe(true)
    const raw = JSON.stringify(bundle)
    expect(raw).not.toMatch(/""/)
  })

  it('comparación FAILED responde bundle con retrieval: []', async () => {
    const { bundle } = await getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_failed')
    expect(bundle.retrieval).toEqual([])
  })

  it('semilla PHP (DEC-PHP-RET-001): el bundle lleva SAME_NAMESPACE, FULLY_QUALIFIED_REFERENCE y DECLARING_CLASS en candidatos', async () => {
    const { bundle } = await getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_php')
    const relations = bundle.retrieval.flatMap((retrieval) => retrieval.candidates.map((candidate) => candidate.structuralRelation))
    expect(relations).toEqual(expect.arrayContaining(['SAME_NAMESPACE', 'FULLY_QUALIFIED_REFERENCE', 'DECLARING_CLASS']))
    expect(bundle.retrieval.every((retrieval) => retrieval.metrics === null)).toBe(true)
  })

  it('experimento PHPUnit (DEMO): el perfil y el runner viajan como cadenas abiertas', async () => {
    const accepted = await mockStartExperiment('prj_checkout_demo', 'demo-scenario-phpunit')
    const { bundle } = await getEvidence('EXPERIMENT', accepted.experimentId)
    expect(bundle.sandbox.every((row) => row.executionProfile === 'PHP_LARAVEL_PHPUNIT' && row.runnerHint === 'PHPUNIT')).toBe(true)
  })

  it('ningún bundle incluye excerpt, testCases, groundTruth, knowledgeId ni claves de almacenamiento', async () => {
    const samples = await Promise.all([
      getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45'),
      getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_completed_con_metricas'),
      getEvidence('RETRIEVAL_COMPARISON', 'rcmp_demo_seed_php'),
    ])
    for (const { raw } of samples) {
      expect(raw).not.toMatch(/"(excerpt|testCases|groundTruth|knowledgeId|storageKey|signedUrl|downloadUrl)"/)
    }
  })
})

describe('getEvidence (modo live)', () => {
  it('conserva el JSON crudo de las tres rutas live', async () => {
    setDataSourceForTests('live')
    const raw = '{\n  "schemaVersion": "1", "kind": "ANALYSIS_RUN"\n}'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(raw, { status: 200 }))
    const result = await getEvidence('ANALYSIS_RUN', 'arun_checkout_pr45')
    expect(result.raw).toBe(raw)
    expect(result.bundle).toMatchObject({ schemaVersion: '1', kind: 'ANALYSIS_RUN' })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/analysis-runs/arun_checkout_pr45/evidence'), expect.anything())
  })
})
