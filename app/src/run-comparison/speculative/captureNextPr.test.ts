import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../../api/mockBackend'
import { setDataSourceForTests } from '../../api/dataSource'
import { armCaptureNextPr, disarmCaptureNextPr, getCaptureNextPrState, simulateNextEligiblePullRequest } from './captureNextPr'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('capture next PR (mock) — HU49, especulativo', () => {
  it('empieza OFF por proyecto', async () => {
    const state = await getCaptureNextPrState('prj_checkout_demo')
    expect(state).toEqual({ projectId: 'prj_checkout_demo', status: 'OFF', armedAt: null })
  })

  it('arma la captura y la deja lista para simular una llegada', async () => {
    const armed = await armCaptureNextPr('prj_checkout_demo')
    expect(armed.status).toBe('ARMED')
    expect(armed.armedAt).not.toBeNull()

    const state = await getCaptureNextPrState('prj_checkout_demo')
    expect(state.status).toBe('ARMED')
  })

  it('cancelar vuelve a OFF sin capturar nada', async () => {
    await armCaptureNextPr('prj_checkout_demo')
    const disarmed = await disarmCaptureNextPr('prj_checkout_demo')
    expect(disarmed).toEqual({ projectId: 'prj_checkout_demo', status: 'OFF', armedAt: null })
  })

  it('rechaza simular una llegada si no está armado', async () => {
    await expect(simulateNextEligiblePullRequest('prj_checkout_demo')).rejects.toThrow(/no está armado/)
  })

  it('simula la llegada de un PR elegible, crea el AnalysisRun y vuelve a OFF (one-shot)', async () => {
    await armCaptureNextPr('prj_checkout_demo')
    const captured = await simulateNextEligiblePullRequest('prj_checkout_demo')
    expect(captured.projectId).toBe('prj_checkout_demo')
    expect(captured.status).toBe('SUCCESS')

    const state = await getCaptureNextPrState('prj_checkout_demo')
    expect(state.status).toBe('OFF')
  })

  it('el estado armado es independiente por proyecto', async () => {
    await armCaptureNextPr('prj_checkout_demo')
    const billing = await getCaptureNextPrState('prj_billing_demo')
    expect(billing.status).toBe('OFF')
  })
})

describe('capture next PR (live) — sin contrato aprobado', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('rechaza con ProposedCapabilityError', async () => {
    await expect(getCaptureNextPrState('prj_checkout_demo')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
    await expect(armCaptureNextPr('prj_checkout_demo')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
    await expect(disarmCaptureNextPr('prj_checkout_demo')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
    await expect(simulateNextEligiblePullRequest('prj_checkout_demo')).rejects.toThrow(/propuesta de producto sin contrato aprobado/)
  })
})
