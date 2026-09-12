import type { RagContextTraceDetail, SourceExcerpt } from '../types'
import { discardReasonLabel, ragSignalLabel } from './ragLabels'

/** spec.md HU27: hasta tres líneas antes/después, "desvanecidas progresivamente" — no un fade plano. */
function fadeOpacity(distanceFromSnippet: number): number {
  return Math.max(0.3, 0.75 - distanceFromSnippet * 0.2)
}

function ExcerptView({ excerpt }: { excerpt: SourceExcerpt }) {
  return <div className="excerpt-view">
    <div className="excerpt-lines faded">{excerpt.before.map((line, index) => <div key={line.lineNumber} className="excerpt-line" style={{ opacity: fadeOpacity(excerpt.before.length - 1 - index) }}><span className="line-number">{line.lineNumber}</span><code>{line.content}</code></div>)}</div>
    <div className="excerpt-lines snippet"><pre><code>{excerpt.snippet}</code></pre></div>
    <div className="excerpt-lines faded">{excerpt.after.map((line, index) => <div key={line.lineNumber} className="excerpt-line" style={{ opacity: fadeOpacity(index) }}><span className="line-number">{line.lineNumber}</span><code>{line.content}</code></div>)}</div>
    {excerpt.truncated && <p className="excerpt-truncated" role="note">Contenido truncado; no se muestra el archivo completo.</p>}
    <p className="excerpt-hash"><span>Hash del contenido</span><code>{excerpt.contentSha256}</code></p>
  </div>
}

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
