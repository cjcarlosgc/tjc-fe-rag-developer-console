import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { listAnalysisRuns } from '../control-plane/api'
import { experimentCaptureErrorMessage, isExperimentCaptureStale, isExperimentCaptureUnsupported } from '../control-plane/errors'
import { armExperimentCapture, disarmExperimentCapture, listExperimentCaptures } from './api'

// INTEROP-2.25 (§6.17, HU18): contrato de captura armada. La API live se simula con `fetch`; el demo, con el mock.

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const coreError = (code: string, status: number) => json({ code, message: 'mensaje crudo de Core', correlationId: 'corr-core' }, status)

const armedCapture = {
  captureId: 'cap_live_1',
  projectId: 'prj_1',
  status: 'ARMED',
  armedBy: 'usr_1',
  armedAt: '2026-10-30T10:00:00.000Z',
  reservedAnalysisRunId: null,
  reservedAt: null,
  disarmedBy: null,
  disarmedAt: null,
}

describe('live: captura armada de experimentación (INTEROP-2.25 §6.17)', () => {
  beforeEach(() => setDataSourceForTests('live'))
  afterEach(() => {
    vi.restoreAllMocks()
    setDataSourceForTests(null)
  })

  it('arma con POST a la ruta del Project, sin cuerpo y sin Idempotency-Key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(armedCapture, 201))

    const result = await armExperimentCapture('prj_1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/projects\/prj_1\/experiment-captures$/)
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
    expect(Object.keys(init.headers as Record<string, string>).map((key) => key.toLowerCase())).not.toContain('idempotency-key')
    expect(result).toMatchObject({ captureId: 'cap_live_1', status: 'ARMED' })
  })

  it('desarma con DELETE a /current, sin cuerpo', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ ...armedCapture, status: 'DISARMED', disarmedBy: 'usr_1', disarmedAt: '2026-10-30T11:00:00.000Z' }))

    const result = await disarmExperimentCapture('prj_1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/projects\/prj_1\/experiment-captures\/current$/)
    expect(init.method).toBe('DELETE')
    expect(init.body).toBeUndefined()
    expect(result).toMatchObject({ status: 'DISARMED', disarmedBy: 'usr_1' })
  })

  it('lista con GET y pasa cursor y limit solo si existen', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ items: [armedCapture], nextCursor: null }))

    await listExperimentCaptures('prj_1', null, 5)
    await listExperimentCaptures('prj_1', 'cur_2')

    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit | undefined]
    const [secondUrl] = fetchMock.mock.calls[1] as [string, RequestInit | undefined]
    expect(firstUrl).toMatch(/\/projects\/prj_1\/experiment-captures\?limit=5$/)
    expect(firstInit?.method ?? 'GET').toBe('GET')
    expect(secondUrl).toMatch(/\/projects\/prj_1\/experiment-captures\?cursor=cur_2$/)
  })

  it('409 EXPERIMENT_CAPTURE_ALREADY_ARMED se traduce al mensaje de dominio y marca el estado como obsoleto', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(coreError('EXPERIMENT_CAPTURE_ALREADY_ARMED', 409))

    const error = await armExperimentCapture('prj_1').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(experimentCaptureErrorMessage(error)).toBe('Ya hay una captura armada en este Project. Desármala antes de armar otra.')
    expect(isExperimentCaptureStale(error)).toBe(true)
  })

  it('404 EXPERIMENT_CAPTURE_NOT_ARMED se traduce al mensaje de dominio al desarmar', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(coreError('EXPERIMENT_CAPTURE_NOT_ARMED', 404))

    const error = await disarmExperimentCapture('prj_1').catch((caught: unknown) => caught)

    expect(experimentCaptureErrorMessage(error)).toBe('No hay una captura armada para desarmar.')
    expect(isExperimentCaptureStale(error)).toBe(true)
  })

  it('403 de rol usa el mensaje propio de la captura, no el detalle genérico de rol', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ code: 'PROJECT_ROLE_INSUFFICIENT', message: 'x', details: { requiredRole: 'MAINTAINER', currentRole: 'WRITER' } }, 403),
    )

    const error = await armExperimentCapture('prj_1').catch((caught: unknown) => caught)

    expect(experimentCaptureErrorMessage(error)).toBe('No tienes permiso para armar o desarmar capturas en este Project.')
    expect(isExperimentCaptureStale(error)).toBe(false)
  })

  it('404 que no es PROJECT_NOT_FOUND en el listado indica Core sin la ruta; PROJECT_NOT_FOUND no', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(coreError('NOT_FOUND', 404))
      .mockResolvedValueOnce(coreError('PROJECT_NOT_FOUND', 404))

    const unsupported = await listExperimentCaptures('prj_1', null, 5).catch((caught: unknown) => caught)
    const missing = await listExperimentCaptures('prj_1', null, 5).catch((caught: unknown) => caught)

    expect(isExperimentCaptureUnsupported(unsupported)).toBe(true)
    expect(isExperimentCaptureUnsupported(missing)).toBe(false)
  })
})

describe('mock: captura armada de experimentación (demo, sin reloj real en las aserciones)', () => {
  beforeEach(() => {
    setDataSourceForTests('mock')
    resetMockBackend()
  })
  afterEach(() => setDataSourceForTests(null))

  it('el Project demo lista primero la captura RESERVED y después la DISARMED', async () => {
    const page = await listExperimentCaptures('prj_checkout_demo', null, 5)

    expect(page.nextCursor).toBeNull()
    expect(page.items.map((item) => item.status)).toEqual(['RESERVED', 'DISARMED'])
    expect(page.items[0]).toMatchObject({ captureId: 'cap_demo_checkout_2', reservedAnalysisRunId: 'arun_checkout_pr47' })
  })

  it('armar y luego armar otra responde 409 EXPERIMENT_CAPTURE_ALREADY_ARMED y no duplica la captura', async () => {
    const armed = await armExperimentCapture('prj_billing_demo')
    expect(armed).toMatchObject({ status: 'ARMED', projectId: 'prj_billing_demo', reservedAnalysisRunId: null })
    expect(armed.armedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const error = await armExperimentCapture('prj_billing_demo').catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 409, code: 'EXPERIMENT_CAPTURE_ALREADY_ARMED' })
    const page = await listExperimentCaptures('prj_billing_demo', null, 5)
    expect(page.items).toHaveLength(1)
  })

  it('desarmar sin captura ARMED responde 404 EXPERIMENT_CAPTURE_NOT_ARMED', async () => {
    const error = await disarmExperimentCapture('prj_billing_demo').catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 404, code: 'EXPERIMENT_CAPTURE_NOT_ARMED' })
  })

  it('armar, desarmar y volver a armar: la más reciente va primero y el desarme queda registrado', async () => {
    const first = await armExperimentCapture('prj_billing_demo')
    const disarmed = await disarmExperimentCapture('prj_billing_demo')

    expect(disarmed).toMatchObject({ captureId: first.captureId, status: 'DISARMED', disarmedBy: 'usr_demo_maintainer' })
    expect(disarmed.disarmedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const second = await armExperimentCapture('prj_billing_demo')
    const page = await listExperimentCaptures('prj_billing_demo', null, 5)
    expect(page.items.map((item) => [item.captureId, item.status])).toEqual([
      [second.captureId, 'ARMED'],
      [first.captureId, 'DISARMED'],
    ])
  })

  it('un Reader o un Writer no arman ni desarman: 403 PROJECT_ROLE_INSUFFICIENT', async () => {
    const readerError = await armExperimentCapture('prj_org_metrics_demo').catch((caught: unknown) => caught)
    const writerError = await armExperimentCapture('prj_org_writer_demo').catch((caught: unknown) => caught)

    expect(readerError).toMatchObject({ status: 403, code: 'PROJECT_ROLE_INSUFFICIENT' })
    expect(writerError).toMatchObject({ status: 403, code: 'PROJECT_ROLE_INSUFFICIENT' })
  })

  it('un Project sin capturas lista una página vacía; uno inexistente responde PROJECT_NOT_FOUND', async () => {
    expect(await listExperimentCaptures('prj_org_orders_demo', null, 5)).toEqual({ items: [], nextCursor: null })

    const error = await listExperimentCaptures('prj_no_existe', null, 5).catch((caught: unknown) => caught)
    expect(error).toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('solo el Run reservado lleva experimentCapture; los demás Runs lo tienen en null', async () => {
    const { items } = await listAnalysisRuns('prj_checkout_demo')

    const reserved = items.find((run) => run.id === 'arun_checkout_pr47')
    expect(reserved?.experimentCapture).toEqual({ captureId: 'cap_demo_checkout_2', reservedAt: '2026-09-10T11:00:00.000Z' })
    for (const run of items.filter((item) => item.id !== 'arun_checkout_pr47')) expect(run.experimentCapture).toBeNull()
  })

  it('resetMockBackend devuelve las capturas al estado sembrado', async () => {
    await armExperimentCapture('prj_billing_demo')
    resetMockBackend()

    expect(await listExperimentCaptures('prj_billing_demo', null, 5)).toEqual({ items: [], nextCursor: null })
  })
})
