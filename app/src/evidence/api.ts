import { apiRequestText } from '../api/client'
import { getDataSource } from '../api/dataSource'
import { mockGetEvidence } from '../api/mockBackend'
import type { EvidenceBundleResponse, EvidenceKind } from './types'

export interface EvidenceDownload {
  /** Texto tal como lo devuelve Core (en mock, serializado de forma determinista). */
  raw: string
  bundle: EvidenceBundleResponse
}

/**
 * INTEROP-2.7 §6.16 (WI-CONSOLE-017): exportación de evidencia versionada, Reader.
 * El adapter consume las rutas publicadas y conserva el JSON crudo para descargarlo sin reserialización.
 */
export async function getEvidence(kind: EvidenceKind, subjectId: string): Promise<EvidenceDownload> {
  if (getDataSource() === 'mock') {
    const bundle = await mockGetEvidence(kind, subjectId)
    return { raw: JSON.stringify(bundle, null, 2), bundle }
  }
  const resource = kind === 'ANALYSIS_RUN'
    ? `/analysis-runs/${encodeURIComponent(subjectId)}/evidence`
    : kind === 'EXPERIMENT'
      ? `/experiments/${encodeURIComponent(subjectId)}/evidence`
      : `/retrieval-comparisons/${encodeURIComponent(subjectId)}/evidence`
  const raw = await apiRequestText(resource)
  return { raw, bundle: JSON.parse(raw) as EvidenceBundleResponse }
}
