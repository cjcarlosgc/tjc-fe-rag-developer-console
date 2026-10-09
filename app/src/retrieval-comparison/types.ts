import type { AnalysisSymbolResponse } from '../control-plane/types'

/**
 * INTEROP-2.7 §6.15 (WI-CONSOLE-014, Corte A) — **definido, pendiente de implementar en Core** (WI-CORE-022).
 * Comparación de retrieval OE2 (SE vs SEM): capacidad experimental, separada de OE5 y del producto operativo.
 * Los tipos reproducen §6.15 sin campos extra. La Console nunca envía `groundTruth` en este corte.
 */

export { findEligibleSymbols } from '../run-comparison/types'

export type RetrievalMode = 'SE' | 'SEM'

export type StructuralRelation = 'IMPORTS' | 'IMPORTED_BY' | 'SAME_NAMESPACE' | 'FULLY_QUALIFIED_REFERENCE' | 'DECLARING_CLASS'

export type RetrievalComparisonStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/** Etiquetas en español centralizadas. Las relaciones PHP no se prometen en esta UI: su implementación queda diferida (WI-CORE-028). */
export const STRUCTURAL_RELATION_LABELS: Record<StructuralRelation, string> = {
  IMPORTS: 'Importa',
  IMPORTED_BY: 'Importado por',
  SAME_NAMESPACE: 'Mismo namespace',
  FULLY_QUALIFIED_REFERENCE: 'Referencia completamente calificada',
  DECLARING_CLASS: 'Clase declarante',
}

export const NO_STRUCTURAL_RELATION_LABEL = 'Sin relación estructural'
export const NOT_AVAILABLE_LABEL = 'no disponible'
export const NOT_APPLICABLE_LABEL = 'no aplica'

/** SEM no evalúa relación estructural: su `null` significa «no aplica», no «sin relación». SE conserva «sin relación» para su `null`. */
export function structuralRelationLabel(relation: StructuralRelation | null, mode: RetrievalMode = 'SE'): string {
  if (relation) return STRUCTURAL_RELATION_LABELS[relation]
  return mode === 'SEM' ? NOT_APPLICABLE_LABEL : NO_STRUCTURAL_RELATION_LABEL
}

/** Valores de configuración que no aplican a un modo (p. ej. pesos en SEM) se muestran como «no aplica», nunca como «null». */
export function formatConfigValue(value: string | number | null): string {
  return value === null ? NOT_APPLICABLE_LABEL : String(value)
}

/** `null` significa «no disponible» (p. ej. métricas sin verdad de terreno externa), nunca cero. */
export function formatRetrievalScore(value: number | null): string {
  return value === null ? NOT_AVAILABLE_LABEL : value.toFixed(3)
}

export function formatRetrievalMetric(value: number | null): string {
  return value === null ? NOT_AVAILABLE_LABEL : value.toFixed(2)
}

/** §5: `COMPLETED` y `FAILED` son estados terminales; antes de ellos los resultados responden 409. */
export function isTerminalRetrievalStatus(status: RetrievalComparisonStatus): status is 'COMPLETED' | 'FAILED' {
  return status === 'COMPLETED' || status === 'FAILED'
}

/** §5 `AsyncAccepted` del 202 de `POST /retrieval-comparisons`. */
export interface RetrievalComparisonAcceptedResponse {
  status: 'PENDING'
  pollAfterMs: number
  analysisRunId: string
  retrievalComparisonId: string
  projectVersionId: string
}

export interface RetrievalGroundTruthItem {
  filePath: string
  symbolQualifiedName: string
}

/** `groundTruth` existe en el contrato, pero la Console no lo envía en este corte (AC3 de WI-CONSOLE-014). */
export interface CreateRetrievalComparisonRequest {
  analysisRunId: string
  symbolFilePath: string
  symbolQualifiedName: string
  groundTruth?: RetrievalGroundTruthItem[]
}

export interface RetrievalComparisonStatusResponse {
  id: string
  analysisRunId: string
  projectId: string
  projectVersionId: string
  symbol: AnalysisSymbolResponse
  status: RetrievalComparisonStatus
  failureCode: string | null
  failureMessage: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface RetrievalCandidateResponse {
  rank: number
  chunkId: string
  filePath: string
  symbolQualifiedName: string | null
  semanticScore: number | null
  structuralRelation: StructuralRelation | null
  /** Solo en SE; null en SEM. */
  combinedScore: number | null
  selected: boolean
}

export interface RetrievalMetricsResponse {
  precisionAt5: number
  recallAt5: number
  precisionAt10: number
  recallAt10: number
}

export interface RetrievalModeResultResponse {
  mode: RetrievalMode
  retrievalId: string
  config: {
    semanticTopK: number
    finalTopK: number
    semanticWeight: number | null
    structuralWeight: number | null
    embeddingModel: string
  }
  candidates: RetrievalCandidateResponse[]
  metrics: RetrievalMetricsResponse | null
}

export interface RetrievalComparisonResultsResponse {
  retrievalComparisonId: string
  analysisRunId: string
  projectVersionId: string
  symbol: AnalysisSymbolResponse
  /** Exactamente SE y SEM. */
  modes: RetrievalModeResultResponse[]
  completedAt: string
}

/** §6.15 `Page<RetrievalComparisonStatusResponse>` (solo estado; los resultados se piden aparte). */
export interface RetrievalComparisonListPage {
  items: RetrievalComparisonStatusResponse[]
  nextCursor: string | null
}
