import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetAnalysisRunContextTrace, mockGetContextTrace, mockListDiscoveredFiles, mockListExperimentContextTraces } from '../api/mockBackend'
import type { ContextTraceDetail, ContextTracePage, DiscoveredFilePage, ExperimentContextTraceFilters, RagContextTraceDetail } from './types'

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

/** Vista de contexto RAG asociada a un AnalysisRun PR-driven en la demo. */
export function getAnalysisRunContextTrace(analysisRunId: string): Promise<RagContextTraceDetail | null> {
  if (getDataSource() === 'mock') return mockGetAnalysisRunContextTrace(analysisRunId)
  return Promise.reject(new PendingContractError('el contexto recolectado de un Analysis Run'))
}
