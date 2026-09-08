import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { isMockDataSource } from '../api/dataSource'
import { subscribeProjectVersionUpdates } from '../api/socket'
import { getAnalysisOperation } from './api'

const terminalStatuses = new Set(['COMPLETED', 'FAILED'])

export function nextPollInterval(
  operation: { status: string } | undefined,
  initialPollAfterMs: number,
): number | false {
  if (operation && terminalStatuses.has(operation.status)) return false
  return initialPollAfterMs
}

/** HU21: complementa el polling de `GET /project-versions/{id}` con push por WebSocket; nunca lo reemplaza. */
function useRealtimeAnalysis(operationId: string | null, terminal: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (isMockDataSource() || !operationId || terminal) return
    return subscribeProjectVersionUpdates(operationId, () => {
      void queryClient.invalidateQueries({ queryKey: ['analysis', operationId] })
    })
  }, [operationId, terminal, queryClient])
}

export function useAnalysisOperation(operationId: string | null, initialPollAfterMs = 1_000) {
  const query = useQuery({
    queryKey: ['analysis', operationId],
    queryFn: ({ signal }) => getAnalysisOperation(operationId!, signal),
    enabled: Boolean(operationId),
    refetchInterval: (query) => {
      return nextPollInterval(query.state.data, initialPollAfterMs)
    },
  })
  useRealtimeAnalysis(operationId, Boolean(query.data && terminalStatuses.has(query.data.status)))
  return query
}
