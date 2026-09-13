import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetContextQuestionSet, mockListActionRequired, mockListFunctionalKnowledge, mockSubmitFunctionalAnswer } from '../api/mockBackend'
import type { ActionRequiredListPage, FunctionalAnswerAcceptedResponse, FunctionalKnowledgeListPage, FunctionalKnowledgeStatus, FunctionalQuestionSetResponse, SubmitFunctionalAnswerRequest } from './types'

/** HU38: `GET /action-required?projectId&cursor&limit`. RAG Core todavía no publica el control plane PR-driven; la rama live queda pendiente (INTEROP-2.0 §6.11). */
export function listActionRequired(projectId?: string): Promise<ActionRequiredListPage> {
  if (getDataSource() === 'mock') return mockListActionRequired(projectId)
  return Promise.reject(new PendingContractError('la bandeja Action Required'))
}

/** HU37: `GET /analysis-runs/{analysisRunId}/context-questions`. */
export function getContextQuestionSet(analysisRunId: string): Promise<FunctionalQuestionSetResponse> {
  if (getDataSource() === 'mock') return mockGetContextQuestionSet(analysisRunId)
  return Promise.reject(new PendingContractError('las preguntas de contexto funcional de un Run'))
}

/** HU37: `POST /analysis-runs/{analysisRunId}/context-questions/{questionId}/answers`. */
export function submitFunctionalAnswer(analysisRunId: string, questionId: string, input: SubmitFunctionalAnswerRequest): Promise<FunctionalAnswerAcceptedResponse> {
  if (getDataSource() === 'mock') return mockSubmitFunctionalAnswer(analysisRunId, questionId, input)
  return Promise.reject(new PendingContractError('el envío de una respuesta funcional'))
}

/** HU35/HU36: `GET /projects/{projectId}/functional-knowledge?status&cursor&limit`. */
export function listFunctionalKnowledge(projectId: string, status?: FunctionalKnowledgeStatus): Promise<FunctionalKnowledgeListPage> {
  if (getDataSource() === 'mock') return mockListFunctionalKnowledge(projectId, status)
  return Promise.reject(new PendingContractError('el conocimiento funcional persistido'))
}
