import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetRetrievalComparison, mockGetRetrievalComparisonResults, mockListRetrievalComparisons, mockStartRetrievalComparison } from '../api/mockBackend'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import {
  MAX_GROUND_TRUTH_ITEMS,
  type CreateRetrievalComparisonRequest,
  type RetrievalComparisonAcceptedResponse,
  type RetrievalComparisonListPage,
  type RetrievalComparisonResultsResponse,
  type RetrievalComparisonStatusResponse,
  type RetrievalGroundTruthItem,
} from './types'

/**
 * INTEROP-2.7 §6.15. El adapter live usa exclusivamente los campos publicados por Core.
 */
/** Guarda local: rechaza antes de cualquier red si `groundTruth` supera el tope de §6.15. */
export function assertGroundTruthWithinLimit(groundTruth: RetrievalGroundTruthItem[] | undefined): void {
  if (groundTruth && groundTruth.length > MAX_GROUND_TRUTH_ITEMS) {
    throw new RangeError(`La verdad de terreno admite como máximo ${MAX_GROUND_TRUTH_ITEMS} elementos; recibió ${groundTruth.length}. No se envió la comparación.`)
  }
}

/**
 * Cuerpo del `POST /retrieval-comparisons`. La UI solo envía los campos que usa hoy: nunca `groundTruth` (AC3 de WI-CONSOLE-014).
 * Si un llamador pasa `groundTruth`, se valida el tope local antes de construir la solicitud.
 */
export function buildRetrievalComparisonRequest(
  analysisRunId: string,
  symbol: AnalysisSymbolResponse,
  groundTruth?: RetrievalGroundTruthItem[],
): Omit<CreateRetrievalComparisonRequest, 'groundTruth'> {
  assertGroundTruthWithinLimit(groundTruth)
  return { analysisRunId, symbolFilePath: symbol.filePath, symbolQualifiedName: symbol.qualifiedName }
}

/** `POST /retrieval-comparisons` → 202. Exige `Idempotency-Key` (UUID) estable en reintentos de transporte. */
export function startRetrievalComparison(
  analysisRunId: string,
  symbol: AnalysisSymbolResponse,
  idempotencyKey: string,
): Promise<RetrievalComparisonAcceptedResponse> {
  if (getDataSource() === 'mock') return mockStartRetrievalComparison(analysisRunId, symbol, idempotencyKey)
  return apiRequest<RetrievalComparisonAcceptedResponse>('/retrieval-comparisons', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(buildRetrievalComparisonRequest(analysisRunId, symbol)),
  })
}

/** `GET /retrieval-comparisons/{id}` → estado ligero. */
export function getRetrievalComparison(retrievalComparisonId: string): Promise<RetrievalComparisonStatusResponse> {
  if (getDataSource() === 'mock') return mockGetRetrievalComparison(retrievalComparisonId)
  return apiRequest<RetrievalComparisonStatusResponse>(`/retrieval-comparisons/${encodeURIComponent(retrievalComparisonId)}`)
}

/** `GET /retrieval-comparisons/{id}/results` → 409 `RETRIEVAL_COMPARISON_NOT_FINISHED` en PENDING/RUNNING y 409 `RETRIEVAL_COMPARISON_FAILED` en FAILED. */
export function getRetrievalComparisonResults(retrievalComparisonId: string): Promise<RetrievalComparisonResultsResponse> {
  if (getDataSource() === 'mock') return mockGetRetrievalComparisonResults(retrievalComparisonId)
  return apiRequest<RetrievalComparisonResultsResponse>(`/retrieval-comparisons/${encodeURIComponent(retrievalComparisonId)}/results`)
}

/** `GET /analysis-runs/{analysisRunId}/retrieval-comparisons?cursor&limit` → previas del Run (solo estado). */
export function listRetrievalComparisons(analysisRunId: string, cursor?: string | null): Promise<RetrievalComparisonListPage> {
  if (getDataSource() === 'mock') return mockListRetrievalComparisons(analysisRunId, cursor ?? null)
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  const query = params.toString()
  return apiRequest<RetrievalComparisonListPage>(`/analysis-runs/${encodeURIComponent(analysisRunId)}/retrieval-comparisons${query ? `?${query}` : ''}`)
}
