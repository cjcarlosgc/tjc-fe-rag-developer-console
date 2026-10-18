import { apiRequest } from '../api/client'
import { getDataSource, PendingContractError } from '../api/dataSource'
import { loadMockBackend } from '../api/loadMockBackend'
import type {
  ContextTraceDetail,
  ContextTracePage,
  DiscoveredFilePage,
  ExperimentContextTraceFilters,
  RagContextTraceDetail,
} from './types'

function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function listExperimentContextTraces(experimentId: string, filters: ExperimentContextTraceFilters = {}): Promise<ContextTracePage> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockListExperimentContextTraces(experimentId, filters))
  const query = toQuery({
    strategy: filters.strategy,
    repetition: filters.repetition,
    includeSuperseded: filters.includeSuperseded,
    cursor: filters.cursor,
    limit: filters.limit,
  })
  return apiRequest<ContextTracePage>(`/experiments/${encodeURIComponent(experimentId)}/context-traces${query}`)
}

export function getContextTrace(traceId: string): Promise<ContextTraceDetail> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockGetContextTrace(traceId))
  return apiRequest<ContextTraceDetail>(`/context-traces/${encodeURIComponent(traceId)}`)
}

export function listDiscoveredFiles(traceId: string, step: number, cursor: string | null = null): Promise<DiscoveredFilePage> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockListDiscoveredFiles(traceId, step, cursor))
  return apiRequest<DiscoveredFilePage>(`/context-traces/${encodeURIComponent(traceId)}/discovered-files${toQuery({ step, cursor })}`)
}

/** Vista de contexto RAG asociada a un AnalysisRun PR-driven en la demo. */
export function getAnalysisRunContextTrace(analysisRunId: string): Promise<RagContextTraceDetail | null> {
  if (getDataSource() === 'mock') return loadMockBackend().then((mock) => mock.mockGetAnalysisRunContextTrace(analysisRunId))
  return Promise.reject(new PendingContractError('el contexto recolectado de un Analysis Run'))
}
