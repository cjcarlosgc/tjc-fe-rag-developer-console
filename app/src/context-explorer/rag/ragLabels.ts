import type { RagCandidateNode } from '../types'

export const discardReasonLabel: Record<string, string> = {
  BELOW_MINIMUM_SCORE: 'Descartado: por debajo del score mínimo',
  TOP_K_LIMIT: 'Descartado: fuera del límite top-K',
  TOKEN_BUDGET: 'Descartado: excede el presupuesto de tokens',
}

export type RagSignalKind = 'SEMANTIC' | 'STRUCTURAL' | 'DUAL' | 'NONE'

export function ragSignalKind(candidate: RagCandidateNode): RagSignalKind {
  const semantic = candidate.matchedVia.includes('SEMANTIC')
  const structural = candidate.structuralMatch !== null
  if (semantic && structural) return 'DUAL'
  if (semantic) return 'SEMANTIC'
  if (structural) return 'STRUCTURAL'
  return 'NONE'
}

export function ragSignalLabel(candidate: RagCandidateNode): string {
  const kind = ragSignalKind(candidate)
  if (kind === 'DUAL') return `Señal dual · semántica + ${candidate.structuralMatch === 'IMPORTS' ? 'importa' : 'es importado por'}`
  if (kind === 'SEMANTIC') return 'Señal semántica'
  if (kind === 'STRUCTURAL') return candidate.structuralMatch === 'IMPORTS' ? 'Señal estructural · importa' : 'Señal estructural · es importado por'
  return 'Sin señal'
}

interface RagCandidateFilters {
  search: string
  signalKinds: ReadonlySet<Exclude<RagSignalKind, 'NONE'>>
  showDiscarded: boolean
}

/** HU27 — `spec.md` "Interacción común": la búsqueda/filtros de RAG operan sobre señal, decisión y motivo. */
export function filterRagCandidates(candidates: RagCandidateNode[], filters: RagCandidateFilters): RagCandidateNode[] {
  const query = filters.search.trim().toLowerCase()
  return candidates.filter((candidate) => {
    if (!filters.showDiscarded && candidate.decision === 'DISCARDED') return false
    const kind = ragSignalKind(candidate)
    if (kind !== 'NONE' && !filters.signalKinds.has(kind)) return false
    if (!query) return true
    const haystack = `${candidate.excerpt.symbolName ?? ''} ${candidate.excerpt.filePath} ${candidate.chunkId} ${candidate.excerpt.contentSha256}`.toLowerCase()
    return haystack.includes(query)
  })
}
