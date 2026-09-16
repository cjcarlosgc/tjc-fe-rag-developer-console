import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../../api/mockBackend'
import { setDataSourceForTests } from '../../api/dataSource'
import { getRuleUsage } from './ruleUsage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('trazabilidad de uso (mock) — HU52, especulativo', () => {
  it('lista los Analysis Runs cuyo símbolo coincide con el target de la regla, más recientes primero', async () => {
    const items = await getRuleUsage('fk_coupon_expiry')
    expect(items.map((run) => run.id)).toEqual(['arun_checkout_pr42', 'arun_checkout_pr46'])
  })

  it('devuelve una lista vacía cuando ningún Run tocó el símbolo', async () => {
    await expect(getRuleUsage('fk_discount_engine')).resolves.toEqual([])
  })

  it('rechaza con id de regla inexistente', async () => {
    await expect(getRuleUsage('fk_does_not_exist')).rejects.toThrow(/No existe la regla de Functional Knowledge/)
  })
})

describe('trazabilidad de uso (live) — sin contrato aprobado', () => {
  it('rechaza con ProposedCapabilityError', async () => {
    setDataSourceForTests('live')
    await expect(getRuleUsage('fk_coupon_expiry')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })
})
