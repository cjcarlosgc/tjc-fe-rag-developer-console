import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getContextQuestionSet, listActionRequired, submitFunctionalAnswer } from './api'
import type { SubmitFunctionalAnswerRequest } from './types'

export const actionRequiredKeys = {
  list: (projectId?: string) => ['action-required', 'list', projectId ?? null] as const,
  questionSet: (analysisRunId: string) => ['action-required', 'question-set', analysisRunId] as const,
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
