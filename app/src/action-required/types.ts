/** SDD 2.0 / INTEROP-2.0 §6.11 — Action Required y Functional Knowledge. */

export type FunctionalScope = 'PROJECT' | 'MODULE' | 'CLASS' | 'METHOD' | 'SYMBOL'
export type FunctionalQuestionStatus = 'PENDING' | 'ANSWERED' | 'OBSOLETE'
export type FunctionalAnswerChoice = 'YES' | 'NO' | 'DEPENDS' | 'UNKNOWN' | 'FREE_TEXT'
export type VisualAidKind = 'STATE_DIAGRAM' | 'SYMBOL_RELATION' | 'MINI_DIFF' | 'CODE_FRAGMENT'

/** Símbolo del nuevo control plane PR-driven; distinto de los targets del dominio de generación legacy (`runs/types.ts`). */
export type ControlPlaneSymbolLanguage = 'TYPESCRIPT' | 'PHP'
export type ControlPlaneSymbolKind = 'CLASS' | 'METHOD' | 'FUNCTION' | 'INTERFACE' | 'TYPE' | 'TRAIT' | 'ENUM'
export type SymbolChangeKind = 'DIRECTLY_CHANGED' | 'POTENTIALLY_IMPACTED'

export interface AnalysisSymbolResponse {
  language: ControlPlaneSymbolLanguage
  kind: ControlPlaneSymbolKind
  qualifiedName: string
  filePath: string
  changeKind: SymbolChangeKind
}

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

export interface SubmitFunctionalAnswerRequest {
  choice: FunctionalAnswerChoice
  answer: string | null
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
