import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getAnalysisRunContextTrace, getContextTrace, listDiscoveredFiles, listExperimentContextTraces } from './api'
import { isContextTraceNotFinished } from './errors'
import type { ExperimentContextTraceFilters } from './types'

export const contextTraceKeys = {
  experiment: (experimentId: string, filters: ExperimentContextTraceFilters) => ['experiments', experimentId, 'context-traces', filters] as const,
  detail: (traceId: string) => ['context-traces', traceId] as const,
  discoveredFiles: (traceId: string, step: number) => ['context-traces', traceId, 'discovered-files', step] as const,
  analysisRun: (analysisRunId: string) => ['control-plane', 'analysis-run', analysisRunId, 'context-trace'] as const,
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

/** HU28: `list_files` no dibuja las rutas de una; "Mostrar descubiertos" pagina bajo demanda. */
export function useDiscoveredFiles(traceId: string, step: number) {
  return useInfiniteQuery({
    queryKey: contextTraceKeys.discoveredFiles(traceId, step),
    queryFn: ({ pageParam }) => listDiscoveredFiles(traceId, step, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

/** Contexto RAG asociado al AnalysisRun PR-driven en la demo. */
export function useAnalysisRunContextTrace(analysisRunId: string) {
  return useQuery({
    queryKey: contextTraceKeys.analysisRun(analysisRunId),
    queryFn: () => getAnalysisRunContextTrace(analysisRunId),
    enabled: Boolean(analysisRunId),
  })
}
