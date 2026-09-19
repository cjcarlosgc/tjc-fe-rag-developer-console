import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../../api/mockBackend'
import { setDataSourceForTests } from '../../api/dataSource'
import { getPriorCoverage } from './priorCoverage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('prior coverage (mock) — HU50, especulativo', () => {
  it('devuelve un nivel por cada símbolo del Run, estable entre llamadas', async () => {
    const first = await getPriorCoverage('arun_checkout_pr42')
    expect(Object.keys(first)).toEqual(['CouponPolicy.apply', 'OrderService.calculateTotal'])
    expect(first['CouponPolicy.apply']).toBe('NONE')
    expect(first['OrderService.calculateTotal']).toBe('PARTIAL')

    const second = await getPriorCoverage('arun_checkout_pr42')
    expect(second).toEqual(first)
  })

  it('rechaza con id de Run inexistente', async () => {
    await expect(getPriorCoverage('arun_does_not_exist')).rejects.toThrow(/No existe el Analysis Run/)
  })
})

describe('prior coverage (live) — sin contrato aprobado', () => {
  it('rechaza con ProposedCapabilityError', async () => {
    setDataSourceForTests('live')
    await expect(getPriorCoverage('arun_checkout_pr42')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })
})
