import { beforeEach, describe, expect, it } from 'vitest'
import { PendingContractError, setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { ApiError } from '../api/client'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import { buildRetrievalComparisonRequest, getRetrievalComparison, getRetrievalComparisonResults, listRetrievalComparisons, startRetrievalComparison } from './api'

const KEY_A = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const KEY_B = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'

const calculateTotal: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }
const createOrder: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.createOrder', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }
const couponPolicyClass: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }
const metricsRange: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'MetricsQuery.range', filePath: 'src/metrics/MetricsQuery.ts', changeKind: 'DIRECTLY_CHANGED' }

const CHECKOUT_RUN_PR49 = 'arun_checkout_pr49'

async function expectApiError(promise: Promise<unknown>, status: number, code: string): Promise<void> {
  const error = await promise.then(() => null, (reason: unknown) => reason)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(status)
  expect((error as ApiError).code).toBe(code)
}

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('retrieval-comparison api — INTEROP-2.7 §6.15 (WI-CONSOLE-014, Corte A)', () => {
  describe('modo live', () => {
    beforeEach(() => setDataSourceForTests('live'))

    it('las cuatro operaciones responden PendingContractError: el contrato está definido pero Core no lo publica todavía', async () => {
      await expect(startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)).rejects.toBeInstanceOf(PendingContractError)
      await expect(getRetrievalComparison('rcmp_demo_seed_pending')).rejects.toBeInstanceOf(PendingContractError)
      await expect(getRetrievalComparisonResults('rcmp_demo_seed_pending')).rejects.toBeInstanceOf(PendingContractError)
      await expect(listRetrievalComparisons(CHECKOUT_RUN_PR49)).rejects.toBeInstanceOf(PendingContractError)
    })
  })

  describe('cuerpo del POST', () => {
    it('solo envía analysisRunId, symbolFilePath y symbolQualifiedName; nunca groundTruth', () => {
      const body = buildRetrievalComparisonRequest(CHECKOUT_RUN_PR49, calculateTotal)
      expect(body).toEqual({ analysisRunId: CHECKOUT_RUN_PR49, symbolFilePath: 'src/domain/OrderService.ts', symbolQualifiedName: 'OrderService.calculateTotal' })
      expect(Object.keys(body)).not.toContain('groundTruth')
    })
  })

  describe('POST /retrieval-comparisons (mock)', () => {
    it('exige Idempotency-Key: ausente → 400 IDEMPOTENCY_KEY_REQUIRED, no UUID → 400 INVALID_IDEMPOTENCY_KEY', async () => {
      await expectApiError(startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, ''), 400, 'IDEMPOTENCY_KEY_REQUIRED')
      await expectApiError(startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, 'no-es-uuid'), 400, 'INVALID_IDEMPOTENCY_KEY')
    })

    it('la misma key con el mismo cuerpo devuelve el mismo id sin crear otra comparación (retry de transporte)', async () => {
      const first = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      const retry = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      expect(first.status).toBe('PENDING')
      expect(first.pollAfterMs).toBeGreaterThan(0)
      expect(retry.retrievalComparisonId).toBe(first.retrievalComparisonId)
      expect(first.analysisRunId).toBe(CHECKOUT_RUN_PR49)
      expect(first.projectVersionId).toBe('ver_prj_checkout_demo')

      const page = await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      expect(page.items.filter((item) => item.id === first.retrievalComparisonId)).toHaveLength(1)
    })

    it('la misma key con otro cuerpo responde 409 IDEMPOTENCY_CONFLICT', async () => {
      await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      await expectApiError(startRetrievalComparison(CHECKOUT_RUN_PR49, createOrder, KEY_A), 409, 'IDEMPOTENCY_CONFLICT')
    })

    it('una key nueva para otra acción crea otra comparación', async () => {
      const first = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      const second = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_B)
      expect(second.retrievalComparisonId).not.toBe(first.retrievalComparisonId)
    })

    it('Reader → 403 PROJECT_ROLE_INSUFFICIENT con details requiredRole/currentRole (mínimo Writer)', async () => {
      const error = await startRetrievalComparison('arun_org_metrics_pr15', metricsRange, KEY_A).then(() => null, (reason: unknown) => reason)
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(403)
      expect((error as ApiError).code).toBe('PROJECT_ROLE_INSUFFICIENT')
      expect((error as ApiError).details).toEqual({ requiredRole: 'WRITER', currentRole: 'READER' })
    })

    it('Run inexistente → 404 ANALYSIS_RUN_NOT_FOUND; símbolo fuera del Run → 404 ANALYSIS_SYMBOL_NOT_FOUND', async () => {
      await expectApiError(startRetrievalComparison('arun_no_existe', calculateTotal, KEY_A), 404, 'ANALYSIS_RUN_NOT_FOUND')
      const absent: AnalysisSymbolResponse = { ...calculateTotal, qualifiedName: 'OrderService.refund', filePath: 'src/domain/OrderService.ts' }
      await expectApiError(startRetrievalComparison(CHECKOUT_RUN_PR49, absent, KEY_B), 404, 'ANALYSIS_SYMBOL_NOT_FOUND')
    })

    it('símbolo CLASS del Run → 422 UNSUPPORTED_SYMBOL_KIND (sin 409 RUN_NOT_ELIGIBLE)', async () => {
      await expectApiError(startRetrievalComparison(CHECKOUT_RUN_PR49, couponPolicyClass, KEY_A), 422, 'UNSUPPORTED_SYMBOL_KIND')
    })

    it('un Run OBSOLETE con símbolo elegible sí admite la comparación (OE2 no usa los gates de OE5)', async () => {
      const obsoleteSymbol: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'LateFeePolicy.evaluate', filePath: 'src/domain/LateFeePolicy.ts', changeKind: 'DIRECTLY_CHANGED' }
      const accepted = await startRetrievalComparison('arun_billing_pr17', obsoleteSymbol, KEY_A)
      expect(accepted.status).toBe('PENDING')
    })
  })

  describe('GET y resultados (mock)', () => {
    it('una comparación nueva pasa PENDING → RUNNING → COMPLETED y solo entonces entrega resultados', async () => {
      const accepted = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      await expectApiError(getRetrievalComparisonResults(accepted.retrievalComparisonId), 409, 'RETRIEVAL_COMPARISON_NOT_FINISHED')

      expect((await getRetrievalComparison(accepted.retrievalComparisonId)).status).toBe('RUNNING')
      const done = await getRetrievalComparison(accepted.retrievalComparisonId)
      expect(done.status).toBe('COMPLETED')
      expect(done.failureCode).toBeNull()
      expect(done.startedAt).not.toBeNull()
      expect(done.completedAt).not.toBeNull()

      const results = await getRetrievalComparisonResults(accepted.retrievalComparisonId)
      expect(results.modes.map((mode) => mode.mode)).toEqual(['SE', 'SEM'])
      expect(results.retrievalComparisonId).toBe(accepted.retrievalComparisonId)
      expect(results.symbol.qualifiedName).toBe('OrderService.calculateTotal')
    })

    it('SE publica pesos y combinedScore; SEM publica pesos null, structuralRelation null y combinedScore null', async () => {
      const accepted = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      await getRetrievalComparison(accepted.retrievalComparisonId)
      await getRetrievalComparison(accepted.retrievalComparisonId)
      const results = await getRetrievalComparisonResults(accepted.retrievalComparisonId)
      const se = results.modes.find((mode) => mode.mode === 'SE')!
      const sem = results.modes.find((mode) => mode.mode === 'SEM')!

      expect(se.config).toMatchObject({ semanticTopK: 20, finalTopK: 10, semanticWeight: 0.7, structuralWeight: 0.3 })
      expect(se.candidates.every((candidate) => typeof candidate.combinedScore === 'number')).toBe(true)
      expect(sem.config).toMatchObject({ semanticTopK: 20, finalTopK: 10, semanticWeight: null, structuralWeight: null })
      expect(sem.candidates.every((candidate) => candidate.combinedScore === null && candidate.structuralRelation === null)).toBe(true)
      expect(sem.candidates.every((candidate) => typeof candidate.semanticScore === 'number')).toBe(true)
      expect(se.candidates.filter((candidate) => candidate.selected)).toHaveLength(10)
      expect(sem.candidates.filter((candidate) => candidate.selected)).toHaveLength(10)
    })

    it('sin verdad de terreno externa, metrics es null en ambos modos (nunca 0)', async () => {
      const accepted = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      await getRetrievalComparison(accepted.retrievalComparisonId)
      await getRetrievalComparison(accepted.retrievalComparisonId)
      const results = await getRetrievalComparisonResults(accepted.retrievalComparisonId)
      expect(results.modes.every((mode) => mode.metrics === null)).toBe(true)
    })

    it('un id desconocido → 404 RETRIEVAL_COMPARISON_NOT_FOUND en estado y resultados', async () => {
      await expectApiError(getRetrievalComparison('rcmp_no_existe'), 404, 'RETRIEVAL_COMPARISON_NOT_FOUND')
      await expectApiError(getRetrievalComparisonResults('rcmp_no_existe'), 404, 'RETRIEVAL_COMPARISON_NOT_FOUND')
    })

    it('un FAILED expone failureCode y failureMessage y no entrega resultados', async () => {
      const failed = await getRetrievalComparison('rcmp_demo_seed_failed')
      expect(failed.status).toBe('FAILED')
      expect(failed.failureCode).toBe('DEMO_EMBEDDING_INDEX_UNAVAILABLE')
      expect(failed.failureMessage).toMatch(/embeddings/)
      expect(failed.completedAt).not.toBeNull()
      await expectApiError(getRetrievalComparisonResults('rcmp_demo_seed_failed'), 409, 'RETRIEVAL_COMPARISON_NOT_FINISHED')
    })

    it('un COMPLETED con métricas sembrado las trae en ambos modos; el sin verdad de terreno las deja en null', async () => {
      const withMetrics = await getRetrievalComparisonResults('rcmp_demo_seed_completed_con_metricas')
      expect(withMetrics.modes.every((mode) => mode.metrics !== null)).toBe(true)
      expect(withMetrics.modes.find((mode) => mode.mode === 'SE')!.metrics).toMatchObject({ precisionAt10: 0.7, recallAt10: 0.7 })

      const withoutMetrics = await getRetrievalComparisonResults('rcmp_demo_seed_completed_sin_metricas')
      expect(withoutMetrics.modes.every((mode) => mode.metrics === null)).toBe(true)
    })
  })

  describe('GET /analysis-runs/{id}/retrieval-comparisons (mock)', () => {
    it('lista las previas del Run sin reemplazarlas al crear una nueva (≥3 seeds en pr49)', async () => {
      const before = await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      const seedIds = before.items.map((item) => item.id)
      expect(before.items.length).toBeGreaterThanOrEqual(3)
      expect(seedIds).toEqual(expect.arrayContaining(['rcmp_demo_seed_completed_sin_metricas', 'rcmp_demo_seed_completed_con_metricas', 'rcmp_demo_seed_failed']))

      const created = await startRetrievalComparison(CHECKOUT_RUN_PR49, createOrder, KEY_A)
      const after = await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      expect(after.items.map((item) => item.id)).toEqual(expect.arrayContaining([...seedIds, created.retrievalComparisonId]))
      expect(after.items).toHaveLength(before.items.length + 1)
    })

    it('la lista no avanza el estado: leerla no cambia una comparación en curso', async () => {
      const accepted = await startRetrievalComparison(CHECKOUT_RUN_PR49, calculateTotal, KEY_A)
      await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      const page = await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      expect(page.items.find((item) => item.id === accepted.retrievalComparisonId)!.status).toBe('PENDING')
    })

    it('Run inexistente → 404 ANALYSIS_RUN_NOT_FOUND', async () => {
      await expectApiError(listRetrievalComparisons('arun_no_existe'), 404, 'ANALYSIS_RUN_NOT_FOUND')
    })

    it('pagina con cursor opaco y nextCursor null al final', async () => {
      const first = await listRetrievalComparisons(CHECKOUT_RUN_PR49)
      expect(first.nextCursor).toBeNull()
      const pageWithCursor = await listRetrievalComparisons(CHECKOUT_RUN_PR49, '1')
      expect(pageWithCursor.items).toHaveLength(Math.max(first.items.length - 1, 0))
    })
  })
})
