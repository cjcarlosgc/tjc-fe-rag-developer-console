import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../api/mockBackend'
import { setDataSourceForTests } from '../api/dataSource'
import { getRunComparison, startRunComparison } from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('run-comparison api (mock) — HU48, especulativo', () => {
  it('inicia una comparación PENDING sobre un Run elegible y la resuelve tras varios polls', async () => {
    const accepted = await startRunComparison('arun_checkout_pr45')
    expect(accepted.status).toBe('PENDING')

    const first = await getRunComparison(accepted.comparisonId)
    expect(first.status).toBe('RUNNING')

    await getRunComparison(accepted.comparisonId)
    const completed = await getRunComparison(accepted.comparisonId)
    expect(completed.status).toBe('COMPLETED')
    expect(completed.result).toBeDefined()
  })

  it('rechaza si el Run todavía está ACTION_REQUIRED', async () => {
    await expect(startRunComparison('arun_checkout_pr42')).rejects.toThrow(/contexto funcional/)
  })

  it('rechaza con id de Run inexistente', async () => {
    await expect(startRunComparison('arun_does_not_exist')).rejects.toThrow(/No existe el Analysis Run/)
  })

  it('rechaza con id de comparación inexistente', async () => {
    await expect(getRunComparison('runcmp_does_not_exist')).rejects.toThrow(/No existe la comparación/)
  })
})

describe('run-comparison api (live) — sin contrato aprobado', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('startRunComparison rechaza con ProposedCapabilityError', async () => {
    await expect(startRunComparison('arun_checkout_pr45')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })

  it('getRunComparison rechaza con ProposedCapabilityError', async () => {
    await expect(getRunComparison('runcmp_demo_1')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })
})
