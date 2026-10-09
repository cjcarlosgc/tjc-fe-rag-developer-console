import { getDataSource, PendingContractError } from '../api/dataSource'
import { mockGetEvidence } from '../api/mockBackend'
import type { EvidenceBundleResponse, EvidenceKind } from './types'

export interface EvidenceDownload {
  /** Texto tal como lo devuelve Core (en mock, serializado de forma determinista). */
  raw: string
  bundle: EvidenceBundleResponse
}

/**
 * INTEROP-2.7 §6.16 (WI-CONSOLE-017): exportación de evidencia versionada, Reader.
 * Live pendiente hasta WI-CONSOLE-020: el adapter no inventa rutas ni campos fuera del contrato publicado.
 */
export async function getEvidence(kind: EvidenceKind, subjectId: string): Promise<EvidenceDownload> {
  if (getDataSource() !== 'mock') throw new PendingContractError('la exportación de evidencia')
  const bundle = await mockGetEvidence(kind, subjectId)
  return { raw: JSON.stringify(bundle, null, 2), bundle }
}
