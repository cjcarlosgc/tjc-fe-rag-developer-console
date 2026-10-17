import { apiRequest } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetExperiment, mockStartExperiment } from '../api/mockBackend'
import { toExperimentOperation, type ExperimentResultsResponse, type ExperimentStatusResponse } from './liveMapping'
import type { ExperimentAccepted, ExperimentOperation } from './types'
import type { AnalysisSymbolResponse } from '../control-plane/types'

export interface CreateExperimentInput {
  analysisRunId: string
  symbolFilePath: string
  symbolQualifiedName: string
}

/** Construye el único cuerpo publicado por INTEROP-2.7 §6.5; no acepta ids internos de inventario. */
export function buildCreateExperimentInput(analysisRunId: string, symbol: Pick<AnalysisSymbolResponse, 'filePath' | 'qualifiedName'>): CreateExperimentInput {
  return { analysisRunId, symbolFilePath: symbol.filePath, symbolQualifiedName: symbol.qualifiedName }
}

/** `POST /experiments`, exige `Idempotency-Key` y se ancla a un símbolo de un AnalysisRun. */
export function startExperiment(input: CreateExperimentInput, idempotencyKey: string): Promise<ExperimentAccepted>
/** Compatibilidad exclusiva del mock existente; live no admite el DTO histórico. */
export function startExperiment(projectId: string, targetId: string, idempotencyKey: string): Promise<ExperimentAccepted>
export function startExperiment(inputOrProjectId: CreateExperimentInput | string, keyOrTargetId: string): Promise<ExperimentAccepted> {
  if (typeof inputOrProjectId === 'string') {
    if (getDataSource() !== 'mock') throw new TypeError('El modo live requiere analysisRunId, symbolFilePath y symbolQualifiedName.')
    return mockStartExperiment(inputOrProjectId, keyOrTargetId)
  }
  const input = inputOrProjectId
  const idempotencyKey = keyOrTargetId
  if (getDataSource() === 'mock') return mockStartExperiment(input.analysisRunId, input.symbolQualifiedName)
  return apiRequest<ExperimentAccepted>('/experiments', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(input),
  })
}

/** `GET /experiments/{id}` (+ `/results` cuando ya es COMPLETED). `targetLabel` es solo para mostrar en la tabla de repeticiones. */
export async function getExperiment(experimentId: string, targetLabel: string): Promise<ExperimentOperation> {
  if (getDataSource() === 'mock') return mockGetExperiment(experimentId)
  const status = await apiRequest<ExperimentStatusResponse>(`/experiments/${encodeURIComponent(experimentId)}`)
  if (status.status !== 'COMPLETED') return toExperimentOperation(status, null, targetLabel)
  const results = await apiRequest<ExperimentResultsResponse>(`/experiments/${encodeURIComponent(experimentId)}/results`)
  return toExperimentOperation(status, results, targetLabel)
}
