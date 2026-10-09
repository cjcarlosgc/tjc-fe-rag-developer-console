/** SDD 3.0 / INTEROP-2.7 §6.11 — Action Required y Functional Knowledge (abstención UNKNOWN y escenarios; base INTEROP-2.4). */

import type { AnalysisSymbolResponse } from '../control-plane/types'

export type { AnalysisSymbolResponse } from '../control-plane/types'

export type FunctionalScope = 'PROJECT' | 'MODULE' | 'CLASS' | 'METHOD' | 'SYMBOL'
export type FunctionalQuestionStatus = 'PENDING' | 'ANSWERED' | 'OBSOLETE'
export type FunctionalAnswerChoice = 'YES' | 'NO' | 'DEPENDS' | 'UNKNOWN' | 'FREE_TEXT'
/** INTEROP-2.7 §6.11 (DEC-FK-002): `ABSTAINED` es una abstención auditada de UNKNOWN, no una respuesta. */
export type FunctionalAnswerOutcome = 'ANSWERED' | 'ABSTAINED'
/** INTEROP-2.7 (DEC-FK-001): un escenario por pregunta atómica. */
export type ScenarioKind = 'EXPECTED_RESULT' | 'BOUNDARY' | 'EXCEPTION' | 'STATE_TRANSITION' | 'OBSERVABLE_SIDE_EFFECT' | 'FUNCTIONAL_PRECONDITION'
/** Rol que puede registrar o responder una pregunta funcional (INTEROP-2.7: Writer no responde ni se abstiene). */
export type ConfirmingRole = 'ADMIN' | 'MAINTAINER'
export type VisualAidKind = 'STATE_DIAGRAM' | 'SYMBOL_RELATION' | 'MINI_DIFF' | 'CODE_FRAGMENT'

export interface VisualAidResponse {
  kind: VisualAidKind
  title: string
  content: string
  language: string | null
}

/** INTEROP-2.7 §6.11: abstenciones UNKNOWN auditadas de una pregunta; no incluye identidad en la UI. */
export interface FunctionalAbstentionSummary {
  count: number
  lastAt: string
  lastByUserId: string
  lastByRole: ConfirmingRole
}

export interface FunctionalQuestionResponse {
  id: string
  analysisRunId: string
  projectId: string
  repositoryName: string
  pullRequestNumber: number
  headSha: string
  target: AnalysisSymbolResponse
  question: string
  rationale: string
  status: FunctionalQuestionStatus
  visualAid: VisualAidResponse | null
  /** INTEROP-2.7: escenario de la pregunta atómica (derivado por Core). */
  scenarioKind: ScenarioKind
  /** INTEROP-2.7: clave determinista del escenario; nunca la escribe una persona. */
  scenarioKey: string
  /** INTEROP-2.7: abstenciones UNKNOWN auditadas; `null` si nadie se ha abstenido. */
  abstention: FunctionalAbstentionSummary | null
  createdAt: string
}

export interface FunctionalQuestionSetResponse {
  analysisRunId: string
  currentQuestion: FunctionalQuestionResponse | null
  functionalBehaviorValidated: boolean
}

/** INTEROP-2.1 §6.11 (HU51, definido 2026-09-15 — Core no lo implementó todavía). */
export interface ConflictResolution {
  conflictId: string
  action: 'SUPERSEDE' | 'KEEP_EXISTING'
}

export interface SubmitFunctionalAnswerRequest {
  choice: FunctionalAnswerChoice
  answer: string | null
  conflictResolution?: ConflictResolution
}

export interface FunctionalAnswerAcceptedResponse {
  status: 'PENDING'
  pollAfterMs: number
  analysisRunId: string
  questionId: string
  /** INTEROP-2.7: `ABSTAINED` implica `continuationAttemptId` y `knowledgeId` nulos. */
  outcome: FunctionalAnswerOutcome
  continuationAttemptId: string | null
  knowledgeId: string | null
}

/** `GET /action-required?projectId&cursor&limit` -> `Page<FunctionalQuestionResponse>`. */
export interface ActionRequiredListPage {
  items: FunctionalQuestionResponse[]
  nextCursor: string | null
}

export type FunctionalKnowledgeSource = 'HUMAN_ANSWER' | 'APPROVED_IMPORT'
export type FunctionalKnowledgeStatus = 'ACTIVE' | 'SUPERSEDED'

/** INTEROP-2.7 §6.11: regla de Functional Knowledge con procedencia y escenario. Console no calcula ni edita `scenarioKey`. */
export interface FunctionalKnowledgeResponse {
  id: string
  projectId: string
  scope: FunctionalScope
  targetRef: string | null
  originalQuestion: string
  originalAnswer: string
  normalizedRule: string
  source: FunctionalKnowledgeSource
  status: FunctionalKnowledgeStatus
  supersedesId: string | null
  createdAt: string
  /** INTEROP-2.7 (DEC-FK-004): escenario derivado por Core; solo lectura en la Console. */
  scenarioKind: ScenarioKind
  /** INTEROP-2.7 (DEC-FK-004): clave determinista derivada por Core; nunca la escribe una persona. */
  scenarioKey: string
  /** INTEROP-2.7: id de quien confirmó la regla. Solo el id: la Console no lo resuelve a nombre ni correo. `null` en reglas históricas. */
  confirmedByUserId: string | null
  /** INTEROP-2.7: rol con el que se confirmó. `null` en reglas históricas. */
  confirmedRole: ConfirmingRole | null
  /** INTEROP-2.7: commit de origen de la confirmación. Es procedencia, no vencimiento: no se compara con el HEAD actual. */
  originHeadSha: string | null
  /** INTEROP-2.7: referencia de importación; solo tiene sentido si `source` es `APPROVED_IMPORT`. */
  sourceRef: string | null
}

/** `GET /projects/{projectId}/functional-knowledge?status&cursor&limit` -> `Page<FunctionalKnowledgeResponse>`. */
export interface FunctionalKnowledgeListPage {
  items: FunctionalKnowledgeResponse[]
  nextCursor: string | null
}

/**
 * INTEROP-2.1 §6.11 (HU51, definido 2026-09-15 — Core no lo implementó
 * todavía). `details` de un `409 FUNCTIONAL_KNOWLEDGE_CONFLICT`: la regla
 * `ACTIVE` existente que la respuesta contradice, junto a la regla que se
 * propondría. `conflictId` es de un solo uso y expira si el HEAD cambia.
 */
export interface FunctionalKnowledgeConflictResponse {
  conflictId: string
  analysisRunId: string
  questionId: string
  conflictingKnowledge: FunctionalKnowledgeResponse
  proposedNormalizedRule: string
}
