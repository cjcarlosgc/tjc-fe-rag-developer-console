import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockBackend } from '../api/mockBackend'
import { setDataSourceForTests } from '../api/dataSource'
import { getContextQuestionSet, listActionRequired, listFunctionalKnowledge, submitFunctionalAnswer } from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('action-required api (mock)', () => {
  it('HU38: lista la pregunta vigente por cada Run con contexto pendiente', async () => {
    const page = await listActionRequired()
    expect(page.items.map((item) => item.analysisRunId)).toEqual(['arun_billing_pr17', 'arun_checkout_pr42'])
    expect(page.items.every((item) => item.status === 'PENDING')).toBe(true)
  })

  it('HU38: filtra por projectId', async () => {
    const page = await listActionRequired('prj_checkout_demo')
    expect(page.items).toHaveLength(1)
    expect(page.items[0].analysisRunId).toBe('arun_checkout_pr42')
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
})

describe('action-required api (mock) — HU35/HU36 Functional Knowledge', () => {
  it('lista las reglas de un proyecto, ordenadas por más reciente primero', async () => {
    const page = await listFunctionalKnowledge('prj_checkout_demo')
    expect(page.items.map((item) => item.id)).toEqual(['fk_coupon_expiry', 'fk_rounding_v2', 'fk_rounding_v1'])
  })

  it('filtra por status', async () => {
    const active = await listFunctionalKnowledge('prj_checkout_demo', 'ACTIVE')
    expect(active.items.map((item) => item.id).sort()).toEqual(['fk_coupon_expiry', 'fk_rounding_v2'])

    const superseded = await listFunctionalKnowledge('prj_checkout_demo', 'SUPERSEDED')
    expect(superseded.items.map((item) => item.id)).toEqual(['fk_rounding_v1'])
  })

  it('la regla ACTIVE de rounding referencia a la que reemplaza vía supersedesId', async () => {
    const page = await listFunctionalKnowledge('prj_checkout_demo', 'ACTIVE')
    const v2 = page.items.find((item) => item.id === 'fk_rounding_v2')
    expect(v2?.supersedesId).toBe('fk_rounding_v1')
  })
})

describe('action-required api (live, INTEROP-2.0 aún no publicado)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('listActionRequired rechaza con PendingContractError', async () => {
    await expect(listActionRequired()).rejects.toThrow(/todavía no publicó/)
  })

  it('getContextQuestionSet rechaza con PendingContractError', async () => {
    await expect(getContextQuestionSet('arun_checkout_pr42')).rejects.toThrow(/todavía no publicó/)
  })

  it('submitFunctionalAnswer rechaza con PendingContractError', async () => {
    await expect(submitFunctionalAnswer('arun_checkout_pr42', 'fq_checkout_pr42_1', { choice: 'YES', answer: null })).rejects.toThrow(/todavía no publicó/)
  })

  it('listFunctionalKnowledge rechaza con PendingContractError', async () => {
    await expect(listFunctionalKnowledge('prj_checkout_demo')).rejects.toThrow(/todavía no publicó/)
  })
})
