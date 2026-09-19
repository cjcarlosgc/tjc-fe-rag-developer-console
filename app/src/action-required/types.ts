/** SDD 2.0 / INTEROP-2.0 §6.11 — Action Required y Functional Knowledge. */

import type { AnalysisSymbolResponse } from '../control-plane/types'

export type { AnalysisSymbolResponse } from '../control-plane/types'

export type FunctionalScope = 'PROJECT' | 'MODULE' | 'CLASS' | 'METHOD' | 'SYMBOL'
export type FunctionalQuestionStatus = 'PENDING' | 'ANSWERED' | 'OBSOLETE'
export type FunctionalAnswerChoice = 'YES' | 'NO' | 'DEPENDS' | 'UNKNOWN' | 'FREE_TEXT'
export type VisualAidKind = 'STATE_DIAGRAM' | 'SYMBOL_RELATION' | 'MINI_DIFF' | 'CODE_FRAGMENT'

export interface VisualAidResponse {
  kind: VisualAidKind
  title: string
  content: string
  language: string | null
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
