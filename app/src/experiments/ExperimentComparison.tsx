import { Link } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { formatDuration, formatEstimatedCost, formatPercent } from '../formatting'
import type { ExperimentConfiguration, ExperimentResultViewModel, StrategyMetrics } from './types'

const rateRows: Array<[string, keyof StrategyMetrics]> = [['Válidas', 'validRate'], ['Compilan', 'compilationRate'], ['Ejecutan', 'executionRate'], ['Pasan', 'passedRate']]

const UNAVAILABLE = 'no disponible'

function strategyLabel(strategy: StrategyMetrics['strategy']): string {
  return strategy === 'GENERALIST_AGENT' ? 'AGENTE GENERALISTA' : strategy
}

function relativeDelta(baseline: number | null, rag: number | null): string {
  if (baseline === null || rag === null) return 'n/d'
  if (baseline === 0) return 'sin base'
  const value = (rag - baseline) / baseline * 100
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
}

function signedNumber(value: number, digits = 0): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

/** null/undefined se muestran como «no disponible»; un cero legítimo se formatea normalmente. */
function orUnavailable<T>(value: T | null | undefined, format: (value: T) => string = (v) => String(v)): string {
  return value === null || value === undefined ? UNAVAILABLE : format(value)
}

function evaluableText(value: boolean | null | undefined): string {
  return orUnavailable(value, (v) => (v ? 'Sí' : 'No'))
}

function formatInteger(value: number): string {
  return value.toLocaleString('es-PE')
}

function ConfigurationBlock({ configuration }: { configuration: ExperimentConfiguration | null | undefined }) {
  const c = configuration
  const items: Array<[string, string]> = [
    ['Proveedor y modelo', `${orUnavailable(c?.model.provider)} · ${orUnavailable(c?.model.model)}`],
    ['Versión del modelo', orUnavailable(c?.model.modelVersion)],
    ['Esfuerzo de razonamiento', orUnavailable(c?.model.reasoningEffort)],
    ['Temperatura', orUnavailable(c?.model.temperature, String)],
    ['Máximo de tokens de salida', orUnavailable(c?.model.maxOutputTokens, formatInteger)],
    ['Tope de tool calls', orUnavailable(c?.budget.toolCallCap, formatInteger)],
    ['Presupuesto de contexto', orUnavailable(c?.budget.contextTokenBudget, (v) => `${formatInteger(v)} tokens`)],
    ['Duración máxima', orUnavailable(c?.budget.maxDurationMs, formatDuration)],
    ['Perfil de ejecución', orUnavailable(c?.executionProfile)],
    ['Semilla de aleatorización', orUnavailable(c?.randomizationSeed)],
  ]
  return (
    <section className="retrieval-panel experiment-configuration" aria-labelledby="experiment-configuration-title">
      <div>
        <p className="eyebrow">Ambos brazos</p>
        <h3 id="experiment-configuration-title">Configuración</h3>
        {isMockDataSource() && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
        <p className="configuration-note">Modelo y esfuerzo de razonamiento son comunes a ambos brazos, según los registra Core. Console solo los muestra.</p>
      </div>
      <dl>
        {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  )
}

export function ExperimentComparison({ result, projectId, experimentId }: { result: ExperimentResultViewModel; projectId: string; experimentId: string }) {
  const failures = Array.from(new Set([...Object.keys(result.baseline.failures), ...Object.keys(result.rag.failures)]))
  const durationDelta = result.rag.totalDurationMs - result.baseline.totalDurationMs
  const tokenDelta = result.rag.totalTokens !== null && result.baseline.totalTokens !== null ? result.rag.totalTokens - result.baseline.totalTokens : null
  const costDelta = result.rag.estimatedCost !== null && result.baseline.estimatedCost !== null ? result.rag.estimatedCost - result.baseline.estimatedCost : null
  return (
    <div className="experiment-results">
      <div className="strategy-head">
        <div><span className="strategy-mark baseline-mark">G</span><strong>Agente generalista</strong><small>Explora sus propias referencias</small></div>
        <span className="versus">VS</span>
        <div><span className="strategy-mark rag-mark">R</span><strong>RAG</strong><small>Contexto recuperado</small></div>
      </div>
      <div className="comparison-table" role="table" aria-label="Comparación de estrategias">
        {rateRows.map(([label, key]) => {
          const baseline = result.baseline[key] as number
          const rag = result.rag[key] as number
          const delta = (rag - baseline) * 100
          return (
            <div className="comparison-row" role="row" key={label}>
              <strong>{label}</strong>
              <span>{formatPercent(baseline)}</span>
              <span className="rate-delta">{delta >= 0 ? '+' : ''}{delta.toFixed(1)} pp</span>
              <span>{formatPercent(rag)}</span>
            </div>
          )
        })}
        <div className="comparison-row">
          <strong>Tiempo total</strong>
          <span>{formatDuration(result.baseline.totalDurationMs)}</span>
          <span>Δ {signedNumber(durationDelta)} ms · {relativeDelta(result.baseline.totalDurationMs, result.rag.totalDurationMs)}</span>
          <span>{formatDuration(result.rag.totalDurationMs)}</span>
        </div>
        <div className="comparison-row">
          <strong>Tokens</strong>
          <span>{result.baseline.totalTokens?.toLocaleString('es-PE') ?? '—'}</span>
          <span>Δ {tokenDelta === null ? 'n/d' : signedNumber(tokenDelta)} · {relativeDelta(result.baseline.totalTokens, result.rag.totalTokens)}</span>
          <span>{result.rag.totalTokens?.toLocaleString('es-PE') ?? '—'}</span>
        </div>
        <div className="comparison-row">
          <strong>Costo</strong>
          <span>{result.baseline.estimatedCost === null ? '—' : formatEstimatedCost(result.baseline.estimatedCost)}</span>
          <span>Δ {costDelta === null ? 'n/d' : `${signedNumber(costDelta, 4)} USD`} · {relativeDelta(result.baseline.estimatedCost, result.rag.estimatedCost)}</span>
          <span>{result.rag.estimatedCost === null ? '—' : formatEstimatedCost(result.rag.estimatedCost)}</span>
        </div>
      </div>
      <section className="failure-chart">
        <h3>Distribución de fallos</h3>
        {failures.map((failure) => {
          const baseline = result.baseline.failures[failure as keyof typeof result.baseline.failures] ?? 0
          const rag = result.rag.failures[failure as keyof typeof result.rag.failures] ?? 0
          const max = Math.max(1, baseline, rag)
          return (
            <div className="failure-row" key={failure}>
              <code>{failure}</code>
              <div>
                <span className="failure-bar baseline-bar" style={{ width: `${baseline / max * 100}%` }}>{baseline}</span>
                <span className="failure-bar rag-bar" style={{ width: `${rag / max * 100}%` }}>{rag}</span>
              </div>
            </div>
          )
        })}
      </section>
      <ConfigurationBlock configuration={result.configuration} />
      <section className="retrieval-panel">
        <div>
          <p className="eyebrow">Solo RAG · explicación del contexto</p>
          <h3>Huella de retrieval</h3>
        </div>
        <dl>
          <div><dt>Recuperados</dt><dd>{result.rag.retrievedChunks ?? '—'} chunks</dd></div>
          <div><dt>Seleccionados</dt><dd>{result.rag.selectedChunks ?? '—'} chunks</dd></div>
          <div><dt>Contexto</dt><dd>{result.rag.contextTokens?.toLocaleString('es-PE') ?? '—'} tokens</dd></div>
        </dl>
      </section>
      {(result.baseline.toolCalls != null || result.baseline.filesInspected != null) && (
        <section className="retrieval-panel">
          <div>
            <p className="eyebrow">Solo agente generalista · exploración</p>
            <h3>Huella de exploración</h3>
          </div>
          <dl>
            <div><dt>Tool calls</dt><dd>{result.baseline.toolCalls ?? '—'}</dd></div>
            <div><dt>Archivos inspeccionados</dt><dd>{result.baseline.filesInspected ?? '—'}</dd></div>
          </dl>
        </section>
      )}
      <details className="repetition-detail">
        <summary>Ver detalle por target y repetición</summary>
        <div className="table-frame" role="region" aria-label="Detalle por target y repetición" tabIndex={0}>
          <table aria-label="Tabla de repeticiones por target">
            <thead>
              <tr>
                <th scope="col">Target</th>
                <th scope="col">Repetición</th>
                <th scope="col">Estrategia</th>
                <th scope="col">Válida</th>
                <th scope="col">Par</th>
                <th scope="col">Posición</th>
                <th scope="col">Intento</th>
                <th scope="col">Evaluable</th>
                <th scope="col">Failure type</th>
                <th scope="col">Duración</th>
                <th scope="col">Tokens</th>
                <th scope="col"><span className="visually-hidden">Contexto</span></th>
              </tr>
            </thead>
            <tbody>
              {result.repetitions.map((item, index) => (
                <tr key={`${item.target}-${item.strategy}-${item.repetition}-${index}`}>
                  <td>{item.target}</td>
                  <td>{item.repetition}/3</td>
                  <td><code>{strategyLabel(item.strategy)}</code></td>
                  <td>{item.valid ? 'Sí' : 'No'}</td>
                  <td>{item.pairId === null ? UNAVAILABLE : <code>{item.pairId}</code>}</td>
                  <td>{orUnavailable(item.pairPosition, (p) => `${p}.º en el par`)}</td>
                  <td>{orUnavailable(item.attempt, (a) => `${a}.º`)}</td>
                  <td>
                    {evaluableText(item.technicallyEvaluable)}
                    {item.technicallyEvaluable === false && <span className="evaluability-mark">técnicamente no evaluable</span>}
                  </td>
                  <td>
                    <code>{item.failureType}</code>
                    {item.errorSummary && <div className="structured-error repetition-error-summary"><p>{item.errorSummary}</p></div>}
                  </td>
                  <td>{formatDuration(item.durationMs)}</td>
                  <td>{item.totalTokens ?? '—'}</td>
                  <td>
                    <Link className="target-action" to={`/projects/${projectId}/experimental/${experimentId}/context?strategy=${item.strategy}&repetition=${item.repetition}`}>Ver contexto →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
