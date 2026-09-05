import { formatDuration, formatEstimatedCost, formatPercent } from '../formatting'
import type { ExperimentResultViewModel, StrategyMetrics } from './types'

const rateRows: Array<[string, keyof StrategyMetrics]> = [['Válidas', 'validRate'], ['Compilan', 'compilationRate'], ['Ejecutan', 'executionRate'], ['Pasan', 'passedRate']]

function strategyLabel(strategy: StrategyMetrics['strategy']): string {
  return strategy === 'BASELINE' ? 'AGENTE GENERALISTA' : strategy
}

function relativeDelta(baseline: number, rag: number): string {
  if (baseline === 0) return 'sin base'
  const value = (rag - baseline) / baseline * 100
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
}

function signedNumber(value: number, digits = 0): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function ExperimentComparison({ result }: { result: ExperimentResultViewModel }) {
  const failures = Array.from(new Set([...Object.keys(result.baseline.failures), ...Object.keys(result.rag.failures)]))
  const durationDelta = result.rag.totalDurationMs - result.baseline.totalDurationMs
  const tokenDelta = result.rag.totalTokens - result.baseline.totalTokens
  const costDelta = result.rag.estimatedCost - result.baseline.estimatedCost
  return <div className="experiment-results"><div className="strategy-head"><div><span className="strategy-mark baseline-mark">G</span><strong>Agente generalista</strong><small>Explora sus propias referencias</small></div><span className="versus">VS</span><div><span className="strategy-mark rag-mark">R</span><strong>RAG</strong><small>Contexto recuperado</small></div></div><div className="comparison-table" role="table" aria-label="Comparación de estrategias">{rateRows.map(([label, key]) => { const baseline = result.baseline[key] as number; const rag = result.rag[key] as number; const delta = (rag - baseline) * 100; return <div className="comparison-row" role="row" key={label}><strong>{label}</strong><span>{formatPercent(baseline)}</span><span className={delta >= 0 ? 'positive-delta' : 'negative-delta'}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} pp</span><span>{formatPercent(rag)}</span></div>})}<div className="comparison-row"><strong>Tiempo total</strong><span>{formatDuration(result.baseline.totalDurationMs)}</span><span>Δ {signedNumber(durationDelta)} ms · {relativeDelta(result.baseline.totalDurationMs, result.rag.totalDurationMs)}</span><span>{formatDuration(result.rag.totalDurationMs)}</span></div><div className="comparison-row"><strong>Tokens</strong><span>{result.baseline.totalTokens.toLocaleString('es-PE')}</span><span>Δ {signedNumber(tokenDelta)} · {relativeDelta(result.baseline.totalTokens, result.rag.totalTokens)}</span><span>{result.rag.totalTokens.toLocaleString('es-PE')}</span></div><div className="comparison-row"><strong>Costo</strong><span>{formatEstimatedCost(result.baseline.estimatedCost)}</span><span>Δ {signedNumber(costDelta, 4)} USD · {relativeDelta(result.baseline.estimatedCost, result.rag.estimatedCost)}</span><span>{formatEstimatedCost(result.rag.estimatedCost)}</span></div></div><section className="failure-chart"><h3>Distribución de fallos</h3>{failures.map((failure) => { const baseline = result.baseline.failures[failure as keyof typeof result.baseline.failures] ?? 0; const rag = result.rag.failures[failure as keyof typeof result.rag.failures] ?? 0; const max = Math.max(1, baseline, rag); return <div className="failure-row" key={failure}><code>{failure}</code><div><span className="failure-bar baseline-bar" style={{ width: `${baseline / max * 100}%` }}>{baseline}</span><span className="failure-bar rag-bar" style={{ width: `${rag / max * 100}%` }}>{rag}</span></div></div>})}</section><section className="retrieval-panel"><div><p className="eyebrow">Solo RAG · explicación del contexto</p><h3>Huella de retrieval</h3></div><dl><div><dt>Recuperados</dt><dd>{result.rag.retrievedChunks ?? '—'} chunks</dd></div><div><dt>Seleccionados</dt><dd>{result.rag.selectedChunks ?? '—'} chunks</dd></div><div><dt>Contexto</dt><dd>{result.rag.contextTokens?.toLocaleString('es-PE') ?? '—'} tokens</dd></div></dl></section><details className="repetition-detail"><summary>Ver detalle por target y repetición</summary><div className="table-frame"><table><thead><tr><th>Target</th><th>Repetición</th><th>Estrategia</th><th>Válida</th><th>Failure type</th><th>Duración</th><th>Tokens</th></tr></thead><tbody>{result.repetitions.map((item, index) => <tr key={`${item.target}-${item.strategy}-${item.repetition}-${index}`}><td>{item.target}</td><td>{item.repetition}/3</td><td><code>{strategyLabel(item.strategy)}</code></td><td>{item.valid ? 'Sí' : 'No'}</td><td>{item.failureType}</td><td>{formatDuration(item.durationMs)}</td><td>{item.totalTokens}</td></tr>)}</tbody></table></div></details></div>
}
