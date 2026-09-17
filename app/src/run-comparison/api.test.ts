import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../api/mockBackend'
import { setDataSourceForTests } from '../api/dataSource'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import { getRunComparison, listRunComparisons, startRunComparison } from './api'

const calculateTotal: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }
const couponApply: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'CouponPolicy.apply', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('run-comparison api (mock) — HU48, INTEROP-2.1 §6.5 definido/no implementado', () => {
  it('inicia una comparación PENDING sobre un Run elegible y la resuelve tras varios polls', async () => {
    const accepted = await startRunComparison('arun_checkout_pr45', calculateTotal)
    expect(accepted.status).toBe('PENDING')
    expect(accepted.analysisRunId).toBe('arun_checkout_pr45')

    const first = await getRunComparison(accepted.comparisonId)
    expect(first.status).toBe('RUNNING')
    expect(first.symbol).toEqual(calculateTotal)
    expect(first.result).toBeUndefined()

    await getRunComparison(accepted.comparisonId)
    const completed = await getRunComparison(accepted.comparisonId)
    expect(completed.status).toBe('COMPLETED')
    expect(completed.result).toBeDefined()
  })

  it('rechaza si el Run todavía está ACTION_REQUIRED', async () => {
    await expect(startRunComparison('arun_checkout_pr42', couponApply)).rejects.toThrow(/contexto funcional/)
  })

  it('rechaza un símbolo que no es METHOD/FUNCTION con cambio directo', async () => {
    const notEligible: AnalysisSymbolResponse = { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }
    await expect(startRunComparison('arun_checkout_pr45', notEligible)).rejects.toThrow(/no es un símbolo METHOD\/FUNCTION/)
  })

  it('rechaza con id de Run inexistente', async () => {
    await expect(startRunComparison('arun_does_not_exist', calculateTotal)).rejects.toThrow(/No existe el Analysis Run/)
  })

  it('rechaza con id de comparación inexistente', async () => {
    await expect(getRunComparison('runcmp_does_not_exist')).rejects.toThrow(/No existe la comparación/)
  })

  it('HU48 (Replay): lista todos los trials de un Run, cada uno con su propio símbolo, sin interferir con el polling individual', async () => {
    const first = await startRunComparison('arun_checkout_pr49', calculateTotal)
    const second = await startRunComparison('arun_checkout_pr49', { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.createOrder', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' })

    const page = await listRunComparisons('arun_checkout_pr49')
    expect(page.items.map((item) => item.id).sort()).toEqual([first.comparisonId, second.comparisonId].sort())
    expect(page.items.every((item) => item.status === 'PENDING')).toBe(true)

    await getRunComparison(first.comparisonId)
    const afterOnePoll = await listRunComparisons('arun_checkout_pr49')
    expect(afterOnePoll.items.find((item) => item.id === first.comparisonId)?.status).toBe('RUNNING')
    expect(afterOnePoll.items.find((item) => item.id === second.comparisonId)?.status).toBe('PENDING')
  })
})

describe('run-comparison api (live) — contrato definido, Core no lo implementó', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('startRunComparison rechaza con PendingContractError', async () => {
    await expect(startRunComparison('arun_checkout_pr45', calculateTotal)).rejects.toThrow(/todavía no publicó/)
  })

  it('getRunComparison rechaza con PendingContractError', async () => {
    await expect(getRunComparison('runcmp_demo_1')).rejects.toThrow(/todavía no publicó/)
  })

  it('listRunComparisons rechaza con PendingContractError', async () => {
    await expect(listRunComparisons('arun_checkout_pr45')).rejects.toThrow(/todavía no publicó/)
  })
})
