import { describe, expect, it } from 'vitest'
import type { FunctionalKnowledgeResponse } from './types'
import { confirmingRoleLabel, displayScenarioKey, groupByScenarioKind, scenarioLabel, SCENARIO_KIND_LABELS, SCENARIO_KIND_ORDER, shortSha, supersessionChain, UNKNOWN_SCENARIO_LABEL } from './knowledgeScenarios'

function rule(overrides: Partial<FunctionalKnowledgeResponse> & Pick<FunctionalKnowledgeResponse, 'id'>): FunctionalKnowledgeResponse {
  return {
    projectId: 'prj_test', scope: 'METHOD', targetRef: 'Svc.run', originalQuestion: 'q', originalAnswer: 'a', normalizedRule: 'r',
    source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: null, createdAt: '2026-09-01T00:00:00.000Z',
    scenarioKind: 'EXPECTED_RESULT', scenarioKey: 'key', confirmedByUserId: null, confirmedRole: null, originHeadSha: null, sourceRef: null,
    ...overrides,
  }
}

describe('knowledgeScenarios — escenarios de Functional Knowledge (INTEROP-2.7)', () => {
  it('fija el orden de los seis escenarios de INTEROP-2.7', () => {
    expect(SCENARIO_KIND_ORDER).toEqual(['EXPECTED_RESULT', 'BOUNDARY', 'EXCEPTION', 'STATE_TRANSITION', 'OBSERVABLE_SIDE_EFFECT', 'FUNCTIONAL_PRECONDITION'])
  })

  it('etiqueta cada escenario en español, incluida la excepción con acento', () => {
    expect(SCENARIO_KIND_LABELS).toEqual({
      EXPECTED_RESULT: 'Resultado esperado',
      BOUNDARY: 'Borde',
      EXCEPTION: 'Excepción',
      STATE_TRANSITION: 'Transición de estado',
      OBSERVABLE_SIDE_EFFECT: 'Efecto observable',
      FUNCTIONAL_PRECONDITION: 'Precondición funcional',
    })
    expect(scenarioLabel('EXCEPTION')).toBe('Excepción')
  })

  it('un scenarioKind desconocido se etiqueta como «Otros» sin inventar una etiqueta', () => {
    expect(scenarioLabel('FUTURE_KIND')).toBe(UNKNOWN_SCENARIO_LABEL)
  })

  it('agrupa en el orden fijo y omite los grupos vacíos', () => {
    const groups = groupByScenarioKind([
      rule({ id: 'a', scenarioKind: 'FUNCTIONAL_PRECONDITION' }),
      rule({ id: 'b', scenarioKind: 'EXPECTED_RESULT' }),
      rule({ id: 'c', scenarioKind: 'BOUNDARY' }),
    ])
    expect(groups.map((group) => group.label)).toEqual(['Resultado esperado', 'Borde', 'Precondición funcional'])
    expect(groups.map((group) => group.key)).toEqual(['EXPECTED_RESULT', 'BOUNDARY', 'FUNCTIONAL_PRECONDITION'])
  })

  it('no devuelve grupos cuando no hay reglas', () => {
    expect(groupByScenarioKind([])).toEqual([])
  })

  it('agrupa un scenarioKind desconocido al final como «Otros»', () => {
    const groups = groupByScenarioKind([
      rule({ id: 'x', scenarioKind: 'FUTURE_KIND' as FunctionalKnowledgeResponse['scenarioKind'] }),
      rule({ id: 'y', scenarioKind: 'EXCEPTION' }),
    ])
    expect(groups.map((group) => group.label)).toEqual(['Excepción', 'Otros'])
    expect(groups[1].items.map((item) => item.id)).toEqual(['x'])
  })

  it('dentro de un grupo ordena por target y luego por la más reciente', () => {
    const [group] = groupByScenarioKind([
      rule({ id: 'old', targetRef: 'Svc.a', createdAt: '2026-01-01T00:00:00.000Z' }),
      rule({ id: 'new', targetRef: 'Svc.a', createdAt: '2026-05-01T00:00:00.000Z' }),
      rule({ id: 'other', targetRef: 'Svc.b', createdAt: '2026-09-01T00:00:00.000Z' }),
    ])
    expect(group.items.map((item) => item.id)).toEqual(['new', 'old', 'other'])
  })

  it('shortSha devuelve 7 caracteres y es null-safe', () => {
    expect(shortSha('a1b2c3d4e5f60718293a4b5c6d7e8f9012345678')).toBe('a1b2c3d')
    expect(shortSha(null)).toBeNull()
  })

  it('confirmingRoleLabel distingue Admin y Maintainer y devuelve null sin rol', () => {
    expect(confirmingRoleLabel('ADMIN')).toBe('Admin')
    expect(confirmingRoleLabel('MAINTAINER')).toBe('Maintainer')
    expect(confirmingRoleLabel(null)).toBeNull()
  })
})

describe('knowledgeScenarios — cadena de supersesión', () => {
  const v0 = rule({ id: 'v0', status: 'SUPERSEDED', createdAt: '2026-07-01T00:00:00.000Z' })
  const v1 = rule({ id: 'v1', status: 'SUPERSEDED', supersedesId: 'v0', createdAt: '2026-08-01T00:00:00.000Z' })
  const v2 = rule({ id: 'v2', status: 'ACTIVE', supersedesId: 'v1', createdAt: '2026-09-01T00:00:00.000Z' })

  it('desde el eslabón central devuelve los tres en orden antiguo a reciente', () => {
    expect(supersessionChain([v2, v1, v0], 'v1').map((item) => item.id)).toEqual(['v0', 'v1', 'v2'])
  })

  it('desde la raíz y desde la punta devuelve la misma cadena completa', () => {
    expect(supersessionChain([v2, v1, v0], 'v0').map((item) => item.id)).toEqual(['v0', 'v1', 'v2'])
    expect(supersessionChain([v2, v1, v0], 'v2').map((item) => item.id)).toEqual(['v0', 'v1', 'v2'])
  })

  it('una regla sin supersesión devuelve solo sí misma', () => {
    expect(supersessionChain([v0], 'v0').map((item) => item.id)).toEqual(['v0'])
  })

  it('un id que no está en la lista devuelve cadena vacía', () => {
    expect(supersessionChain([v0, v1, v2], 'missing')).toEqual([])
  })

  it('corta la cadena en un supersedesId ausente en vez de fallar', () => {
    const orphan = rule({ id: 'orphan', supersedesId: 'not-loaded', status: 'ACTIVE' })
    expect(supersessionChain([orphan], 'orphan').map((item) => item.id)).toEqual(['orphan'])
  })

  it('termina con ciclos de supersesión sin bucle infinito', () => {
    const a = rule({ id: 'a', supersedesId: 'b' })
    const b = rule({ id: 'b', supersedesId: 'a' })
    expect(supersessionChain([a, b], 'a').map((item) => item.id).sort()).toEqual(['a', 'b'])
  })
})

describe('estado vacío de escenario y clave (INTEROP-2.7 §6.11)', () => {
  it('displayScenarioKey: null y LEGACY no son claves visibles; una clave real sí', () => {
    expect(displayScenarioKey(null)).toBeNull()
    expect(displayScenarioKey('LEGACY')).toBeNull()
    expect(displayScenarioKey('order.calculateTotal.rounding')).toBe('order.calculateTotal.rounding')
  })
})
