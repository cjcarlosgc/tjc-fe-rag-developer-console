import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetContextQuestionSet, mockListActionRequired, mockListFunctionalKnowledge, mockSubmitFunctionalAnswer } from '../api/mockBackend'
import type { ActionRequiredListPage, FunctionalAnswerAcceptedResponse, FunctionalKnowledgeListPage, FunctionalKnowledgeStatus, FunctionalQuestionSetResponse, SubmitFunctionalAnswerRequest } from './types'

/** HU38 (INTEROP-2.2 §6.11, implementado y desplegado en Core): `GET /action-required?projectId&cursor&limit` — inbox cross-project, `projectId` opcional. */
export function listActionRequired(projectId?: string): Promise<ActionRequiredListPage> {
  if (getDataSource() === 'mock') return mockListActionRequired(projectId)
  const params = new URLSearchParams()
  if (projectId) params.set('projectId', projectId)
  const query = params.toString()
  return apiRequest<ActionRequiredListPage>(`/action-required${query ? `?${query}` : ''}`)
}

/** HU37: `GET /analysis-runs/{analysisRunId}/context-questions` — una pregunta a la vez, sin total fijo. */
export function getContextQuestionSet(analysisRunId: string): Promise<FunctionalQuestionSetResponse> {
  if (getDataSource() === 'mock') return mockGetContextQuestionSet(analysisRunId)
  return apiRequest<FunctionalQuestionSetResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}/context-questions`)
}

/**
 * HU37/HU51: `POST /analysis-runs/{analysisRunId}/context-questions/{questionId}/answers`. `answer` es
 * opcional en el DTO real de Core (no acepta `null` explícito) — se omite la clave cuando no aplica.
 * Un `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` llega como `ApiError` con `details: FunctionalKnowledgeConflictResponse`
 * (`FocusModePage` ya lo consume así).
 */
export function submitFunctionalAnswer(analysisRunId: string, questionId: string, input: SubmitFunctionalAnswerRequest): Promise<FunctionalAnswerAcceptedResponse> {
  if (getDataSource() === 'mock') return mockSubmitFunctionalAnswer(analysisRunId, questionId, input)
  const body: { choice: typeof input.choice; answer?: string; conflictResolution?: typeof input.conflictResolution } = { choice: input.choice }
  if (input.answer) body.answer = input.answer
  if (input.conflictResolution) body.conflictResolution = input.conflictResolution
  return apiRequest<FunctionalAnswerAcceptedResponse>(`/analysis-runs/${encodeURIComponent(analysisRunId)}/context-questions/${encodeURIComponent(questionId)}/answers`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** HU35/HU36 (implementado y desplegado en Core): `GET /projects/{projectId}/functional-knowledge?status&cursor&limit`. */
export function listFunctionalKnowledge(projectId: string, status?: FunctionalKnowledgeStatus): Promise<FunctionalKnowledgeListPage> {
  if (getDataSource() === 'mock') return mockListFunctionalKnowledge(projectId, status)
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const query = params.toString()
  return apiRequest<FunctionalKnowledgeListPage>(`/projects/${encodeURIComponent(projectId)}/functional-knowledge${query ? `?${query}` : ''}`)
}
