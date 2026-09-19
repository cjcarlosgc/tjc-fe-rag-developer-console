import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getContextQuestionSet, listActionRequired, listFunctionalKnowledge, submitFunctionalAnswer } from './api'
import type { FunctionalKnowledgeStatus, SubmitFunctionalAnswerRequest } from './types'

export const actionRequiredKeys = {
  list: (projectId?: string) => ['action-required', 'list', projectId ?? null] as const,
  questionSet: (analysisRunId: string) => ['action-required', 'question-set', analysisRunId] as const,
  functionalKnowledge: (projectId: string, status?: FunctionalKnowledgeStatus) => ['action-required', 'functional-knowledge', projectId, status ?? null] as const,
}

export function useActionRequiredList(projectId?: string) {
  return useQuery({
    queryKey: actionRequiredKeys.list(projectId),
    queryFn: () => listActionRequired(projectId),
  })
}

export function useContextQuestionSet(analysisRunId: string) {
  return useQuery({
    queryKey: actionRequiredKeys.questionSet(analysisRunId),
    queryFn: () => getContextQuestionSet(analysisRunId),
    enabled: Boolean(analysisRunId),
  })
}

export function useFunctionalKnowledge(projectId: string, status?: FunctionalKnowledgeStatus) {
  return useQuery({
    queryKey: actionRequiredKeys.functionalKnowledge(projectId, status),
    queryFn: () => listFunctionalKnowledge(projectId, status),
    enabled: Boolean(projectId),
  })
}

export function useSubmitFunctionalAnswer(analysisRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: SubmitFunctionalAnswerRequest }) =>
      submitFunctionalAnswer(analysisRunId, questionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actionRequiredKeys.questionSet(analysisRunId) })
      void queryClient.invalidateQueries({ queryKey: ['action-required', 'list'] })
    },
  })
}
