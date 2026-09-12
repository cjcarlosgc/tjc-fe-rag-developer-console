import { ExcerptView } from '../ExcerptView'
import type { RagContextTraceDetail } from '../types'
import { discardReasonLabel, ragSignalLabel } from './ragLabels'

interface Props {
  detail: RagContextTraceDetail
  selectedId: string | null
}

/** HU27: panel lateral liquid glass compartido por target/candidato. El score nunca se rotula como probabilidad. */
export function RagSidePanel({ detail, selectedId }: Props) {
  if (!selectedId || selectedId === detail.targetId) {
    const target = detail.target
    return <aside className="side-panel" aria-label="Detalle del target">
      <p className="eyebrow">Target</p>
      <h3>{target.excerpt.symbolName ?? target.excerpt.filePath}</h3>
      <dl className="side-panel-meta">
        <div><dt>Archivo</dt><dd>{target.excerpt.filePath}</dd></div>
        {target.excerpt.parentSymbolName && <div><dt>Símbolo padre</dt><dd>{target.excerpt.parentSymbolName}</dd></div>}
        <div><dt>Tokens</dt><dd>{target.tokenCount}</dd></div>
        <div><dt>Chunks</dt><dd>{target.chunkIds.length}</dd></div>
      </dl>
      <ExcerptView excerpt={target.excerpt} />
    </aside>
  }

  const candidate = detail.candidates.find((item) => item.chunkId === selectedId)
  if (!candidate) return <aside className="side-panel" aria-label="Detalle del nodo"><p>Selecciona un nodo del grafo para ver su detalle.</p></aside>

  return <aside className="side-panel" aria-label="Detalle del candidato">
    <p className="eyebrow">Candidato · rank {candidate.rank}</p>
    <h3>{candidate.excerpt.symbolName ?? candidate.excerpt.filePath.split('/').at(-1)}</h3>
    <dl className="side-panel-meta">
      <div><dt>Archivo</dt><dd>{candidate.excerpt.filePath}</dd></div>
      {candidate.excerpt.parentSymbolName && <div><dt>Símbolo padre</dt><dd>{candidate.excerpt.parentSymbolName}</dd></div>}
      <div><dt>Rango</dt><dd>{candidate.excerpt.startLine != null && candidate.excerpt.endLine != null ? `L${candidate.excerpt.startLine}–L${candidate.excerpt.endLine}` : 'No disponible'}</dd></div>
      <div><dt>Score combinado</dt><dd>{candidate.combinedScore.toFixed(2)} <small>(no representa una probabilidad)</small></dd></div>
      {candidate.semanticScore != null && <div><dt>Score semántico</dt><dd>{candidate.semanticScore.toFixed(2)}</dd></div>}
      <div><dt>Tokens</dt><dd>{candidate.tokenCount}</dd></div>
      <div><dt>Señales</dt><dd>{ragSignalLabel(candidate)}</dd></div>
      <div><dt>Decisión</dt><dd className={candidate.decision === 'SELECTED' ? 'decision-selected' : 'decision-discarded'}>{candidate.decision === 'SELECTED' ? 'Seleccionado' : 'Descartado'}</dd></div>
      {candidate.discardReason && <div><dt>Motivo de descarte</dt><dd>{discardReasonLabel[candidate.discardReason]}</dd></div>}
    </dl>
    <ExcerptView excerpt={candidate.excerpt} />
  </aside>
}
