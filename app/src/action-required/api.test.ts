import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { resetMockBackend } from '../api/mockBackend'
import { setDataSourceForTests } from '../api/dataSource'
import { getAnalysisRun, listTestProposals } from '../control-plane/api'
import { getContextQuestionSet, listActionRequired, listFunctionalKnowledge, submitFunctionalAnswer } from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('action-required api (mock)', () => {
  it('HU38: lista la pregunta vigente por cada Run con contexto pendiente', async () => {
    const page = await listActionRequired()
    expect(page.items.map((item) => item.analysisRunId)).toEqual(['arun_billing_pr17', 'arun_checkout_pr42', 'arun_billing_pr24', 'arun_checkout_pr52'])
    expect(page.items.every((item) => item.status === 'PENDING')).toBe(true)
  })

  it('HU38: filtra por projectId', async () => {
    const page = await listActionRequired('prj_checkout_demo')
    expect(page.items.map((item) => item.analysisRunId)).toEqual(['arun_checkout_pr42', 'arun_checkout_pr52'])
  })

  it('HU37: la pregunta adaptativa avanza a la siguiente del mismo Run tras responder', async () => {
    const before = await getContextQuestionSet('arun_checkout_pr42')
    expect(before.currentQuestion?.id).toBe('fq_checkout_pr42_1')
    expect(before.functionalBehaviorValidated).toBe(false)

    const accepted = await submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'YES', answer: null })
    expect(accepted.continuationAttemptId).not.toBeNull()
    expect(accepted.knowledgeId).not.toBeNull()

    const after = await getContextQuestionSet('arun_checkout_pr42')
    expect(after.currentQuestion?.id).toBe('fq_checkout_pr42_2')
  })

  it('HU37: "No lo sé" (UNKNOWN) cierra la pregunta sin crear conocimiento y continúa el Run', async () => {
    const accepted = await submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'UNKNOWN', answer: null })
    expect(accepted.knowledgeId).toBeNull()
    expect(accepted.continuationAttemptId).not.toBeNull()
  })

  it('HU37: al responder la última pregunta del Run, queda validado y sin pregunta vigente', async () => {
    await submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'YES', answer: null })
    await submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_2', { choice: 'NO', answer: 'trunca al centavo' })
    const after = await getContextQuestionSet('arun_checkout_pr42')
    expect(after.currentQuestion).toBeNull()
    expect(after.functionalBehaviorValidated).toBe(true)
  })

  it('HU36/HU37: corrección por HEAD nuevo — la pregunta queda OBSOLETE y el Run no se reanuda', async () => {
    const accepted = await submitFunctionalAnswer('arun_billing_pr17', 'fq_billing_pr17_1', { choice: 'YES', answer: null })
    expect(accepted.continuationAttemptId).toBeNull()
    expect(accepted.knowledgeId).toBeNull()

    const after = await getContextQuestionSet('arun_billing_pr17')
    expect(after.currentQuestion).toBeNull()
    expect(after.functionalBehaviorValidated).toBe(false)
  })

  it('rechaza responder una pregunta que ya no está PENDING', async () => {
    await submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'YES', answer: null })
    await expect(submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'YES', answer: null })).rejects.toThrow()
  })

  it('caso "respuesta revela inconsistencia": responder la pregunta de PR#24 muta el Run a BEHAVIORAL_MISMATCH', async () => {
    const before = await getAnalysisRun('arun_billing_pr24')
    expect(before.status).toBe('ACTION_REQUIRED')

    await submitFunctionalAnswer('arun_billing_pr24', 'fq_billing_pr24_1', { choice: 'NO', answer: null })

    const after = await getAnalysisRun('arun_billing_pr24')
    expect(after.status).toBe('BEHAVIORAL_MISMATCH')
    expect(after.resultSummary).toContain('contradice la regla')
    const proposals = await listTestProposals('arun_billing_pr24')
    expect(proposals.items).toEqual([expect.objectContaining({ status: 'HELD' })])
  })
})

describe('action-required api (mock) — HU51, conflicto de Functional Knowledge (INTEROP-2.1 §6.11, definido/no implementado)', () => {
  it('sin conflictResolution: rechaza con 409 y expone la regla ACTIVE existente', async () => {
    await expect(submitFunctionalAnswer('arun_checkout_pr52', 'fq_checkout_pr52_1', { choice: 'YES', answer: 'sí, para corporativos' }))
      .rejects.toMatchObject({
        status: 409,
        code: 'FUNCTIONAL_KNOWLEDGE_CONFLICT',
        details: expect.objectContaining({ conflictingKnowledge: expect.objectContaining({ id: 'fk_shipping_zone', status: 'ACTIVE' }) }),
      })

    const after = await getContextQuestionSet('arun_checkout_pr52')
    expect(after.currentQuestion?.status).toBe('PENDING')
  })

  it('SUPERSEDE: persiste la nueva regla ACTIVE y pasa la existente a SUPERSEDED', async () => {
    let conflictId = ''
    try {
      await submitFunctionalAnswer('arun_checkout_pr52', 'fq_checkout_pr52_1', { choice: 'YES', answer: 'sí, para corporativos' })
    } catch (error) {
      conflictId = (error as { details: { conflictId: string } }).details.conflictId
    }
    expect(conflictId).not.toBe('')

    const accepted = await submitFunctionalAnswer('arun_checkout_pr52', 'fq_checkout_pr52_1', { choice: 'YES', answer: 'sí, para corporativos', conflictResolution: { conflictId, action: 'SUPERSEDE' } })
    expect(accepted.knowledgeId).not.toBeNull()

    const rules = await listFunctionalKnowledge('prj_checkout_demo')
    const existing = rules.items.find((item) => item.id === 'fk_shipping_zone')
    expect(existing?.status).toBe('SUPERSEDED')
    const superseded = rules.items.find((item) => item.supersedesId === 'fk_shipping_zone')
    expect(superseded?.status).toBe('ACTIVE')
  })

  it('KEEP_EXISTING: registra la respuesta como evidencia sin tocar la regla vigente', async () => {
    let conflictId = ''
    try {
      await submitFunctionalAnswer('arun_checkout_pr52', 'fq_checkout_pr52_1', { choice: 'NO', answer: null })
    } catch (error) {
      conflictId = (error as { details: { conflictId: string } }).details.conflictId
    }

    const accepted = await submitFunctionalAnswer('arun_checkout_pr52', 'fq_checkout_pr52_1', { choice: 'NO', answer: null, conflictResolution: { conflictId, action: 'KEEP_EXISTING' } })
    expect(accepted.knowledgeId).toBeNull()
    expect(accepted.continuationAttemptId).not.toBeNull()

    const rules = await listFunctionalKnowledge('prj_checkout_demo', 'ACTIVE')
    expect(rules.items.find((item) => item.id === 'fk_shipping_zone')?.status).toBe('ACTIVE')
  })
})

describe('action-required api (mock) — HU35/HU36 Functional Knowledge', () => {
  it('lista las reglas de un proyecto, ordenadas por más reciente primero', async () => {
    const page = await listFunctionalKnowledge('prj_checkout_demo')
    expect(page.items.map((item) => item.id)).toEqual(['fk_coupon_expiry', 'fk_rounding_v2', 'fk_shipping_zone', 'fk_rounding_v1'])
  })

  it('filtra por status', async () => {
    const active = await listFunctionalKnowledge('prj_checkout_demo', 'ACTIVE')
    expect(active.items.map((item) => item.id).sort()).toEqual(['fk_coupon_expiry', 'fk_rounding_v2', 'fk_shipping_zone'])

    const superseded = await listFunctionalKnowledge('prj_checkout_demo', 'SUPERSEDED')
    expect(superseded.items.map((item) => item.id)).toEqual(['fk_rounding_v1'])
  })

  it('la regla ACTIVE de rounding referencia a la que reemplaza vía supersedesId', async () => {
    const page = await listFunctionalKnowledge('prj_checkout_demo', 'ACTIVE')
    const v2 = page.items.find((item) => item.id === 'fk_rounding_v2')
    expect(v2?.supersedesId).toBe('fk_rounding_v1')
  })
})

describe('action-required api (live) — HU35-38, Core ya lo implementó (INTEROP-2.2 §6.11, handoff 2026-09-19)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('listActionRequired pide GET /action-required con projectId opcional en la query', async () => {
    const page = { items: [], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))
    await expect(listActionRequired('prj_real')).resolves.toEqual(page)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/action-required\?projectId=prj_real$/), expect.anything())
  })

  it('listActionRequired sin projectId no manda query', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 }))
    await listActionRequired()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/action-required$/), expect.anything())
  })

  it('getContextQuestionSet pide GET /analysis-runs/{id}/context-questions', async () => {
    const set = { analysisRunId: 'arun_real', currentQuestion: null, functionalBehaviorValidated: true }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(set), { status: 200 }))
    await expect(getContextQuestionSet('arun_real')).resolves.toEqual(set)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/analysis-runs/arun_real/context-questions'), expect.anything())
  })

  it('submitFunctionalAnswer omite `answer` cuando es null (el DTO real no acepta esa clave)', async () => {
    const accepted = { status: 'PENDING', pollAfterMs: 500, analysisRunId: 'arun_real', questionId: 'fq_1', continuationAttemptId: null, knowledgeId: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(accepted), { status: 202 }))
    await expect(submitFunctionalAnswer('arun_real', 'fq_1', { choice: 'YES', answer: null })).resolves.toEqual(accepted)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/analysis-runs/arun_real/context-questions/fq_1/answers'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ choice: 'YES' }) }),
    )
  })

  it('submitFunctionalAnswer: un 409 FUNCTIONAL_KNOWLEDGE_CONFLICT llega como ApiError con details', async () => {
    const conflict = { conflictId: 'fq_1', analysisRunId: 'arun_real', questionId: 'fq_1', conflictingKnowledge: { id: 'fk_1' }, proposedNormalizedRule: 'x' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'FUNCTIONAL_KNOWLEDGE_CONFLICT', message: 'x', details: conflict }), { status: 409 }))
    const error = await submitFunctionalAnswer('arun_real', 'fq_1', { choice: 'YES', answer: 'sí' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('FUNCTIONAL_KNOWLEDGE_CONFLICT')
    expect((error as ApiError).details).toEqual(conflict)
  })

  it('listFunctionalKnowledge pide GET /projects/{id}/functional-knowledge con status opcional', async () => {
    const page = { items: [], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))
    await expect(listFunctionalKnowledge('prj_real', 'ACTIVE')).resolves.toEqual(page)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/prj_real\/functional-knowledge\?status=ACTIVE$/), expect.anything())
  })
})
