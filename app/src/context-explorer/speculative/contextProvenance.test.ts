import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../../api/mockBackend'
import { setDataSourceForTests } from '../../api/dataSource'
import { getContextProvenance } from './contextProvenance'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('context provenance (mock) — HU54, especulativo', () => {
  it('deriva reglas FK y evidencia de tests existentes a partir de los símbolos del Run', async () => {
    const provenance = await getContextProvenance('arun_checkout_pr45')
    expect(provenance.functionalKnowledgeRefs).toEqual([{ id: 'fk_rounding_v2', normalizedRule: 'El total calculado redondea al centavo más cercano (no trunca).' }])
    expect(provenance.existingTestEvidence).toEqual([{ filePath: 'src/domain/OrderService.spec.ts', testName: 'OrderService.calculateTotal — comportamiento existente' }])
  })

  it('rechaza con id de Run inexistente', async () => {
    await expect(getContextProvenance('arun_does_not_exist')).rejects.toThrow(/No existe el Analysis Run/)
  })
})

describe('context provenance (live) — sin contrato aprobado', () => {
  it('rechaza con ProposedCapabilityError', async () => {
    setDataSourceForTests('live')
    await expect(getContextProvenance('arun_checkout_pr45')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })
})
