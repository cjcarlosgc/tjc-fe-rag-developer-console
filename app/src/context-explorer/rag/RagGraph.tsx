import { useMemo } from 'react'
import { GraphCanvas } from '../graph/GraphCanvas'
import { Legend } from '../graph/Legend'
import { computeGraphLayout } from '../graph/graphLayout'
import type { RagContextTraceDetail } from '../types'
import { discardReasonLabel, ragSignalKind, ragSignalLabel } from './ragLabels'

function signalClassName(kind: ReturnType<typeof ragSignalKind>): string {
  if (kind === 'DUAL') return 'signal-dual'
  if (kind === 'SEMANTIC') return 'signal-semantic'
  if (kind === 'STRUCTURAL') return 'signal-structural'
  return ''
}

interface Props {
  detail: RagContextTraceDetail
  /** Candidatos a graficar tras aplicar búsqueda/filtros; por defecto todos los de la traza. */
  candidates?: RagContextTraceDetail['candidates']
  selectedId: string | null
  onSelect: (id: string) => void
}

/** HU27: grafo horizontal target→candidatos. Todo camino termina en un nodo visible; sin huérfanos. */
export function RagGraph({ detail, candidates = detail.candidates, selectedId, onSelect }: Props) {
  const rootId = detail.targetId
  const sortedCandidates = useMemo(() => [...candidates].sort((a, b) => a.rank - b.rank), [candidates])
  const candidateIds = useMemo(() => sortedCandidates.map((candidate) => candidate.chunkId), [sortedCandidates])
  const layout = useMemo(() => computeGraphLayout(rootId, candidateIds), [rootId, candidateIds])
  const edges = useMemo(() => candidateIds.map((id) => ({ from: rootId, to: id })), [candidateIds, rootId])
  const candidateById = useMemo(() => new Map(sortedCandidates.map((candidate) => [candidate.chunkId, candidate])), [sortedCandidates])

  return <div className="rag-graph-shell">
    <Legend items={[
      { swatchClassName: 'legend-semantic', label: 'Señal semántica' },
      { swatchClassName: 'legend-structural', label: 'Señal estructural' },
      { swatchClassName: 'legend-dual', label: 'Coincidencia dual' },
      { swatchClassName: 'legend-selected', label: 'Seleccionado / foco' },
      { swatchClassName: 'legend-discarded', label: 'Descartado (opacidad reducida)' },
    ]} />
    <GraphCanvas
      ariaLabel={`Grafo RAG del target ${detail.target.excerpt.symbolName ?? rootId}`}
      nodes={layout.nodes}
      edges={edges}
      width={layout.width}
      height={layout.height}
      selectedId={selectedId}
      onSelect={onSelect}
      renderNode={(node, state) => {
        if (node.id === rootId) {
          return <span className={`rag-node rag-node-target${state.selected ? ' is-focused' : ''}`}><strong>{detail.target.excerpt.symbolName ?? 'Target'}</strong><small>{detail.target.excerpt.filePath}</small><span className="node-badge">Target</span></span>
        }
        const candidate = candidateById.get(node.id)
        if (!candidate) return null
        const discarded = candidate.decision === 'DISCARDED'
        const kind = ragSignalKind(candidate)
        return <span className={`rag-node ${discarded ? 'discarded' : 'selected-candidate'} ${signalClassName(kind)}${state.selected ? ' is-focused' : ''}`}>
          <strong className={discarded ? 'is-discarded-label' : undefined}>{candidate.excerpt.symbolName ?? candidate.excerpt.filePath.split('/').at(-1)}</strong>
          <small>{candidate.excerpt.filePath}</small>
          <span className="node-badge">{discarded ? (discardReasonLabel[candidate.discardReason ?? ''] ?? 'Descartado') : 'Seleccionado'}</span>
          <span className="node-signal">{ragSignalLabel(candidate)}</span>
          {/* spec.md "Interacción común": hover ofrece resumen sin reemplazar el panel lateral */}
          <span className="node-hover-preview" aria-hidden="true">
            <strong>{ragSignalLabel(candidate)}</strong>
            <span className="hover-preview-path">{candidate.excerpt.filePath}</span>
            <span className="hover-preview-stats">
              <span>Score {candidate.combinedScore.toFixed(2)} · rank {candidate.rank}</span>
              <span>{candidate.tokenCount} tokens</span>
            </span>
            <span className="hover-preview-snippet">{candidate.excerpt.snippet.split('\n')[0]}</span>
          </span>
        </span>
      }}
    />
  </div>
}
