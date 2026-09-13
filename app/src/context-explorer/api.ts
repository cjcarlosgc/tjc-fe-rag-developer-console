import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetAnalysisRunContextTrace, mockGetContextTrace, mockListDiscoveredFiles, mockListExperimentContextTraces, mockListRunContextTraces } from '../api/mockBackend'
import type { ContextTraceDetail, ContextTracePage, DiscoveredFilePage, ExperimentContextTraceFilters, RagContextTraceDetail, RunContextTraceFilters } from './types'

/** HU27/HU28: `INTEROP-1.6 §6.7`. RAG Core todavía no publica estos endpoints; la rama live queda pendiente. */
export function listRunContextTraces(runId: string, filters: RunContextTraceFilters = {}): Promise<ContextTracePage> {
  if (getDataSource() === 'mock') return mockListRunContextTraces(runId, filters)
  return Promise.reject(new PendingContractError('las trazas de contexto de un run'))
}

export function listExperimentContextTraces(experimentId: string, filters: ExperimentContextTraceFilters = {}): Promise<ContextTracePage> {
  if (getDataSource() === 'mock') return mockListExperimentContextTraces(experimentId, filters)
  return Promise.reject(new PendingContractError('las trazas de contexto de un experimento'))
}

export function getContextTrace(traceId: string): Promise<ContextTraceDetail> {
  if (getDataSource() === 'mock') return mockGetContextTrace(traceId)
  return Promise.reject(new PendingContractError('el detalle de una traza de contexto'))
}

export function listDiscoveredFiles(traceId: string, step: number, cursor: string | null = null): Promise<DiscoveredFilePage> {
  if (getDataSource() === 'mock') return mockListDiscoveredFiles(traceId, step, cursor)
  return Promise.reject(new PendingContractError('los archivos descubiertos por el agente'))
}

/** Demo-only: no forma parte de INTEROP-2.0 (§6.7 sigue legacy, sin adaptar al modelo AnalysisRun). */
export function getAnalysisRunContextTrace(analysisRunId: string): Promise<RagContextTraceDetail | null> {
  if (getDataSource() === 'mock') return mockGetAnalysisRunContextTrace(analysisRunId)
  return Promise.reject(new PendingContractError('el contexto recolectado de un Analysis Run'))
}
