import type { SourceExcerpt } from './types'

/** spec.md HU27/HU28: hasta tres líneas antes/después, "desvanecidas progresivamente" — no un fade plano. */
function fadeOpacity(distanceFromSnippet: number): number {
  return Math.max(0.3, 0.75 - distanceFromSnippet * 0.2)
}

/** Panel compartido RAG/AGENT: snippet exacto, líneas circundantes desvanecidas, truncamiento y hash. */
export function ExcerptView({ excerpt }: { excerpt: SourceExcerpt }) {
  return <div className="excerpt-view">
    <div className="excerpt-lines faded">{excerpt.before.map((line, index) => <div key={line.lineNumber} className="excerpt-line" style={{ opacity: fadeOpacity(excerpt.before.length - 1 - index) }}><span className="line-number">{line.lineNumber}</span><code>{line.content}</code></div>)}</div>
    <div className="excerpt-lines snippet"><pre><code>{excerpt.snippet}</code></pre></div>
    <div className="excerpt-lines faded">{excerpt.after.map((line, index) => <div key={line.lineNumber} className="excerpt-line" style={{ opacity: fadeOpacity(index) }}><span className="line-number">{line.lineNumber}</span><code>{line.content}</code></div>)}</div>
    {excerpt.truncated && <p className="excerpt-truncated" role="note">Contenido truncado; no se muestra el archivo completo.</p>}
    <p className="excerpt-hash"><span>Hash del contenido</span><code>{excerpt.contentSha256}</code></p>
  </div>
}
