import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { isMockDataSource } from '../api/dataSource'
import { subscribeTestRunUpdates } from '../api/socket'
import { isTerminalRunStatus, type RunStatus } from './types'

/** HU22: complementa el polling de `GET /test-runs/{runId}` con push por WebSocket; nunca lo reemplaza. */
export function useRealtimeRun(runId: string, status: RunStatus | undefined): void {
  const queryClient = useQueryClient()
  const terminal = status ? isTerminalRunStatus(status) : false
  useEffect(() => {
    if (isMockDataSource() || !runId || terminal) return
    return subscribeTestRunUpdates(runId, () => {
      void queryClient.invalidateQueries({ queryKey: ['runs', runId] })
    })
  }, [runId, terminal, queryClient])
}
