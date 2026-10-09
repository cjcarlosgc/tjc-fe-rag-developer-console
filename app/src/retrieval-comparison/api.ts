import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetRetrievalComparison, mockGetRetrievalComparisonResults, mockListRetrievalComparisons, mockStartRetrievalComparison } from '../api/mockBackend'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import type {
  CreateRetrievalComparisonRequest,
  RetrievalComparisonAcceptedResponse,
  RetrievalComparisonListPage,
  RetrievalComparisonResultsResponse,
  RetrievalComparisonStatusResponse,
} from './types'

/**
 * INTEROP-2.7 §6.15 (WI-CONSOLE-014, Corte A). En modo live todas las operaciones responden `PendingContractError`:
 * el contrato está aprobado, pero Core aún no lo publica (WI-CORE-022) y no se escriben parsers live contra campos no publicados.
 */
const CAPABILITY = 'Comparación de retrieval OE2 (INTEROP-2.7 §6.15)'

/**
 * Cuerpo del `POST /retrieval-comparisons`. Solo envía los campos que la Console usa hoy: nunca `groundTruth` (AC3 de WI-CONSOLE-014),
 * aunque el tipo del contrato lo declare opcional.
 */
export function buildRetrievalComparisonRequest(analysisRunId: string, symbol: AnalysisSymbolResponse): Omit<CreateRetrievalComparisonRequest, 'groundTruth'> {
  return { analysisRunId, symbolFilePath: symbol.filePath, symbolQualifiedName: symbol.qualifiedName }
}

/** `POST /retrieval-comparisons` → 202. Exige `Idempotency-Key` (UUID) estable en reintentos de transporte. */
export function startRetrievalComparison(
  analysisRunId: string,
  symbol: AnalysisSymbolResponse,
  idempotencyKey: string,
): Promise<RetrievalComparisonAcceptedResponse> {
  if (getDataSource() === 'mock') return mockStartRetrievalComparison(analysisRunId, symbol, idempotencyKey)
  return Promise.reject(new PendingContractError(CAPABILITY))
}

/** `GET /retrieval-comparisons/{id}` → estado ligero. */
export function getRetrievalComparison(retrievalComparisonId: string): Promise<RetrievalComparisonStatusResponse> {
  if (getDataSource() === 'mock') return mockGetRetrievalComparison(retrievalComparisonId)
  return Promise.reject(new PendingContractError(CAPABILITY))
}

/** `GET /retrieval-comparisons/{id}/results` → 409 `RETRIEVAL_COMPARISON_NOT_FINISHED` antes de un estado terminal. */
export function getRetrievalComparisonResults(retrievalComparisonId: string): Promise<RetrievalComparisonResultsResponse> {
  if (getDataSource() === 'mock') return mockGetRetrievalComparisonResults(retrievalComparisonId)
  return Promise.reject(new PendingContractError(CAPABILITY))
}

/** `GET /analysis-runs/{analysisRunId}/retrieval-comparisons?cursor&limit` → previas del Run (solo estado). */
export function listRetrievalComparisons(analysisRunId: string, cursor?: string | null): Promise<RetrievalComparisonListPage> {
  if (getDataSource() === 'mock') return mockListRetrievalComparisons(analysisRunId, cursor ?? null)
  return Promise.reject(new PendingContractError(CAPABILITY))
}
