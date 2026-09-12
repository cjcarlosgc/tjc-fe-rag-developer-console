import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getContextTrace, listExperimentContextTraces, listRunContextTraces } from './api'
import { isContextTraceNotFinished } from './errors'
import type { ExperimentContextTraceFilters, RunContextTraceFilters } from './types'

export const contextTraceKeys = {
  run: (runId: string, filters: RunContextTraceFilters) => ['test-runs', runId, 'context-traces', filters] as const,
  experiment: (experimentId: string, filters: ExperimentContextTraceFilters) => ['experiments', experimentId, 'context-traces', filters] as const,
  detail: (traceId: string) => ['context-traces', traceId] as const,
}

export function useRunContextTraces(runId: string, filters: RunContextTraceFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: contextTraceKeys.run(runId, filters),
    queryFn: ({ pageParam }) => listRunContextTraces(runId, { ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && Boolean(runId),
  })
}

export function useExperimentContextTraces(experimentId: string, filters: ExperimentContextTraceFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: contextTraceKeys.experiment(experimentId, filters),
    queryFn: ({ pageParam }) => listExperimentContextTraces(experimentId, { ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && Boolean(experimentId),
  })
}

/** HU27: mientras la traza responde `409 CONTEXT_TRACE_NOT_FINISHED`, se reintenta por polling en vez de exigir un refresh manual. */
export function useContextTraceDetail(traceId: string | null) {
  return useQuery({
    queryKey: contextTraceKeys.detail(traceId ?? ''),
    queryFn: () => getContextTrace(traceId!),
    enabled: Boolean(traceId),
    refetchInterval: (query) => isContextTraceNotFinished(query.state.error) ? (import.meta.env.MODE === 'test' ? 10 : 900) : false,
  })
}
