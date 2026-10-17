import type { ConfirmingRole, FunctionalKnowledgeResponse, ScenarioKind } from './types'

/**
 * INTEROP-2.7 §6.11 (DEC-FK-004): orden fijo de los grupos de escenario y etiquetas en español.
 * La spec no fija el copy; las etiquetas viven solo aquí para un ajuste único por ux-reviewer.
 */
export const SCENARIO_KIND_ORDER: readonly ScenarioKind[] = ['EXPECTED_RESULT', 'BOUNDARY', 'EXCEPTION', 'STATE_TRANSITION', 'OBSERVABLE_SIDE_EFFECT', 'FUNCTIONAL_PRECONDITION']

export const SCENARIO_KIND_LABELS: Record<ScenarioKind, string> = {
  EXPECTED_RESULT: 'Resultado esperado',
  BOUNDARY: 'Borde',
  EXCEPTION: 'Excepción',
  STATE_TRANSITION: 'Transición de estado',
  OBSERVABLE_SIDE_EFFECT: 'Efecto observable',
  FUNCTIONAL_PRECONDITION: 'Precondición funcional',
}

/** Grupo para un `scenarioKind` que la Console no conoce: no se inventa una etiqueta, se agrupa al final. */
export const UNKNOWN_SCENARIO_LABEL = 'Otros'
export const MISSING_PROVENANCE_LABEL = 'sin procedencia registrada'

export const CONFIRMING_ROLE_LABELS: Record<ConfirmingRole, string> = {
  ADMIN: 'Admin',
  MAINTAINER: 'Maintainer',
}

function isScenarioKind(value: string): value is ScenarioKind {
  return (SCENARIO_KIND_ORDER as readonly string[]).includes(value)
}

/** Sin escenario registrado (p. ej. `scenarioKind` ausente): estado vacío, no la categoría «Otros». */
export const MISSING_SCENARIO_LABEL = 'sin escenario registrado'
/** INTEROP-2.7 §6.11: las reglas históricas llegan con `scenarioKey: 'LEGACY'`; no es una clave de escenario real. */
export const LEGACY_SCENARIO_KEY = 'LEGACY'
export const MISSING_SCENARIO_KEY_LABEL = 'sin clave de escenario (regla histórica)'

/** `scenarioKey` para mostrar: `null` o `LEGACY` se presentan como estado vacío, nunca como una clave. */
export function displayScenarioKey(key: string | null): string | null {
  return key && key !== LEGACY_SCENARIO_KEY ? key : null
}

export function scenarioLabel(kind: string): string {
  return isScenarioKind(kind) ? SCENARIO_KIND_LABELS[kind] : UNKNOWN_SCENARIO_LABEL
}

export function confirmingRoleLabel(role: ConfirmingRole | null): string | null {
  return role ? CONFIRMING_ROLE_LABELS[role] : null
}

export interface ScenarioGroup {
  key: ScenarioKind | 'OTHER'
  label: string
  items: FunctionalKnowledgeResponse[]
}

/** Dentro de un grupo: por target, y luego la más reciente primero. */
function compareWithinGroup(left: FunctionalKnowledgeResponse, right: FunctionalKnowledgeResponse): number {
  const byTarget = (left.targetRef ?? '').localeCompare(right.targetRef ?? '')
  return byTarget !== 0 ? byTarget : right.createdAt.localeCompare(left.createdAt)
}

/** Agrupa por `scenarioKind` en el orden fijo de INTEROP-2.7; omite grupos vacíos y agrupa lo desconocido en «Otros». */
export function groupByScenarioKind(items: FunctionalKnowledgeResponse[]): ScenarioGroup[] {
  const buckets = new Map<ScenarioGroup['key'], FunctionalKnowledgeResponse[]>()
  for (const item of items) {
    const key: ScenarioGroup['key'] = isScenarioKind(item.scenarioKind) ? item.scenarioKind : 'OTHER'
    buckets.set(key, [...(buckets.get(key) ?? []), item])
  }
  const order: Array<ScenarioGroup['key']> = [...SCENARIO_KIND_ORDER, 'OTHER']
  return order.flatMap((key) => {
    const bucket = buckets.get(key)
    if (!bucket || bucket.length === 0) return []
    return [{ key, label: key === 'OTHER' ? UNKNOWN_SCENARIO_LABEL : SCENARIO_KIND_LABELS[key], items: [...bucket].sort(compareWithinGroup) }]
  })
}

/** Primeros 7 caracteres del commit de origen; `null` si no hay procedencia. El valor completo va en el `title`. */
export function shortSha(sha: string | null): string | null {
  return sha ? sha.slice(0, 7) : null
}

/**
 * Cadena de supersesión completa alrededor de `id`, de la más antigua a la más reciente.
 * Antecesoras siguiendo `supersedesId`; sucesoras buscando la regla que apunta a la anterior
 * (si hay varias, gana la primera de la lista, que llega ordenada por más reciente).
 * Protegida contra ciclos e ids que no están en `items` (la cadena se corta en vez de fallar).
 */
export function supersessionChain(items: FunctionalKnowledgeResponse[], id: string): FunctionalKnowledgeResponse[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const current = byId.get(id)
  if (!current) return []

  const successorOf = new Map<string, FunctionalKnowledgeResponse>()
  for (const item of items) {
    if (item.supersedesId && byId.has(item.supersedesId) && !successorOf.has(item.supersedesId)) successorOf.set(item.supersedesId, item)
  }

  const visited = new Set<string>([id])
  const predecessors: FunctionalKnowledgeResponse[] = []
  let cursor: FunctionalKnowledgeResponse = current
  while (cursor.supersedesId && byId.has(cursor.supersedesId) && !visited.has(cursor.supersedesId)) {
    const previous = byId.get(cursor.supersedesId) as FunctionalKnowledgeResponse
    visited.add(previous.id)
    predecessors.unshift(previous)
    cursor = previous
  }

  const successors: FunctionalKnowledgeResponse[] = []
  let next = successorOf.get(id)
  while (next && !visited.has(next.id)) {
    visited.add(next.id)
    successors.push(next)
    next = successorOf.get(next.id)
  }

  return [...predecessors, current, ...successors]
}
