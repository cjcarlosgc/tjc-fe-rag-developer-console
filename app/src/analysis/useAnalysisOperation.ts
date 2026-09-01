import { useQuery } from '@tanstack/react-query'
import { getAnalysisOperation } from './api'

const terminalStatuses = new Set(['COMPLETED', 'FAILED'])

export function nextPollInterval(
  operation: { status: string } | undefined,
  initialPollAfterMs: number,
): number | false {
  if (operation && terminalStatuses.has(operation.status)) return false
  return initialPollAfterMs
}

export function useAnalysisOperation(operationId: string | null, initialPollAfterMs = 1_000) {
  return useQuery({
    queryKey: ['analysis', operationId],
    queryFn: ({ signal }) => getAnalysisOperation(operationId!, signal),
    enabled: Boolean(operationId),
    refetchInterval: (query) => {
      return nextPollInterval(query.state.data, initialPollAfterMs)
    },
  })
}
