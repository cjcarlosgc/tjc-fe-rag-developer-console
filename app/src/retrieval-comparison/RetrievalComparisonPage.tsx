import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ApiError } from '../api/client'
import { useIdempotencyKeys } from '../api/idempotency'
import { bindingErrorMessage, errorCorrelationId } from '../control-plane/errors'
import { useAnalysisRun } from '../control-plane/queries'
import type { AnalysisSymbolResponse } from '../control-plane/types'
import { hasRole } from '../projects/roles'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorNote, ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { findEligibleSymbols } from '../run-comparison/types'
import { EvidenceDownload } from '../evidence/EvidenceDownload'
import { retrievalFailureText } from './failureMessages'
import { retrievalComparisonKeys, useRetrievalComparison, useRetrievalComparisonResults, useRetrievalComparisons, useStartRetrievalComparison } from './queries'
import {
  NOT_APPLICABLE_LABEL,
  formatConfigValue,
  formatRetrievalMetric,
  formatRetrievalScore,
  isTerminalRetrievalStatus,
  structuralRelationLabel,
  type RetrievalComparisonResultsResponse,
  type RetrievalComparisonStatus,
  type RetrievalComparisonStatusResponse,
  type RetrievalModeResultResponse,
} from './types'

/** Estado en español junto al código. El estado siempre se lee como texto, nunca solo por color. */
const STATUS_TEXT: Record<RetrievalComparisonStatus, string> = {
  PENDING: 'Pendiente',
  RUNNING: 'En ejecución',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
}

const symbolKey = (symbol: Pick<AnalysisSymbolResponse, 'filePath' | 'qualifiedName'>) => `${symbol.filePath}::${symbol.qualifiedName}`

/**
 * INTEROP-2.7 §6.15 (WI-CONSOLE-014, Corte B). Comparación experimental de retrieval SE vs SEM sobre un símbolo
 * DIRECTLY_CHANGED METHOD/FUNCTION del Run. OE2 no usa los gates de OE5: ACTION_REQUIRED y OBSOLETE no bloquean.
 * No hay ganador, deltas, estadística, barras normalizadas ni verdad de terreno en este corte.
 *
 * Orden de las previas: el que devuelve Core (más reciente primero); se listan sin reemplazar y se piden por cursor.
 */
export function RetrievalComparisonPage() {
  const { projectId = '', analysisRunId = '' } = useParams()
  const runQuery = useAnalysisRun(analysisRunId)
  const projectQuery = useProject(projectId)
  const listQuery = useRetrievalComparisons(analysisRunId)
  const startMutation = useStartRetrievalComparison(analysisRunId)
  const idempotency = useIdempotencyKeys()

  const [selectedKey, setSelectedKey] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pollAfterMs, setPollAfterMs] = useState<number | undefined>(undefined)
  const focusResultRef = useRef(false)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const queryClient = useQueryClient()

  const detailQuery = useRetrievalComparison(activeId, pollAfterMs)
  const detail: RetrievalComparisonStatusResponse | undefined = detailQuery.data
  const resultsQuery = useRetrievalComparisonResults(activeId, detail?.status, pollAfterMs)

  // B1: al llegar a un estado terminal, la previa de esa comparación cambia en Core; la lista ya no es fiable y se vuelve a pedir.
  const detailId = detail?.id
  const detailStatus = detail?.status
  useEffect(() => {
    if (detailId && detailStatus && isTerminalRetrievalStatus(detailStatus)) {
      void queryClient.invalidateQueries({ queryKey: retrievalComparisonKeys.list(analysisRunId) })
    }
  }, [queryClient, analysisRunId, detailId, detailStatus])

  const eligibleSymbols = useMemo(() => (runQuery.data ? findEligibleSymbols(runQuery.data.symbols) : []), [runQuery.data])
  const selectedSymbol = eligibleSymbols.find((symbol) => symbolKey(symbol) === selectedKey) ?? null
  const canWrite = hasRole(projectQuery.data?.role, 'WRITER')
  const roleLoading = projectQuery.isPending
  const isMock = isMockDataSource()
  const previous = listQuery.data?.pages.flatMap((page) => page.items) ?? []

  // Foco programático al encabezado del resultado en cuanto llega (solo tras una acción del usuario).
  useEffect(() => {
    if (resultsQuery.data && focusResultRef.current) {
      focusResultRef.current = false
      resultHeadingRef.current?.focus()
    }
  }, [resultsQuery.data])

  if (runQuery.isPending || projectQuery.isPending) return <LoadingState label="Cargando Analysis Run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const run = runQuery.data
  const idKeyFor = (symbol: AnalysisSymbolResponse) => `start:${analysisRunId}:${symbolKey(symbol)}`
  const terminal = detail ? isTerminalRetrievalStatus(detail.status) : false
  const canStart = canWrite && Boolean(selectedSymbol) && !startMutation.isPending

  function onStart() {
    if (!selectedSymbol) return
    const symbol = selectedSymbol
    const id = idKeyFor(symbol)
    const idempotencyKey = idempotency.getOrCreate(id)
    startMutation.mutate({ symbol, idempotencyKey }, {
      onSuccess: (accepted) => {
        idempotency.clear(id)
        focusResultRef.current = true
        setPollAfterMs(accepted.pollAfterMs)
        setActiveId(accepted.retrievalComparisonId)
      },
      onError: (error) => {
        // Un conflicto de idempotencia significa que la key ya se usó para otra solicitud: la siguiente vez se genera una nueva.
        if (error instanceof ApiError && error.code === 'IDEMPOTENCY_CONFLICT') idempotency.clear(id)
      },
    })
  }

  function onSelectSymbol(value: string) {
    setSelectedKey(value)
    setActiveId(null)
    setPollAfterMs(undefined)
    startMutation.reset()
  }

  function onViewResult(item: RetrievalComparisonStatusResponse) {
    focusResultRef.current = true
    setPollAfterMs(undefined)
    setActiveId(item.id)
  }

  // B3: sin selector ni botón (Reader, o Run sin símbolos) el mensaje no invita a una acción que no existe.
  const idleMessage = roleLoading
    ? 'Comprobando tu rol en el Project…'
    : !eligibleSymbols.length
      ? 'Este Run no tiene símbolos para comparar.'
      : canWrite
        ? 'Elige un símbolo y pulsa «Comparar retrieval SE vs SEM» para iniciar una comparación.'
        : 'Solo lectura: puedes consultar las comparaciones previas.'
  const statusMessage = !activeId
    ? idleMessage
    : detail?.status === 'COMPLETED' ? 'Comparación completada. Resultados disponibles abajo.'
    : detail?.status === 'RUNNING' ? 'Ejecutando retrieval SE y SEM sobre el símbolo elegido.'
    : detail?.status === 'FAILED' ? ''
    : 'Comparación pendiente de empezar.'

  const results: RetrievalComparisonResultsResponse | undefined = resultsQuery.data

  return <section className="retrieval-page">
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Runs', to: '/analysis-runs' }, { label: `PR #${run.pullRequest.number}`, to: `/projects/${projectId}/runs/${analysisRunId}` }, { label: 'Comparación de retrieval' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Modo experimental</p>
        <div className="run-heading-meta"><RepoChip repositoryName={run.pullRequest.repositoryName} /><span className="pr-number">PR #{run.pullRequest.number}</span></div>
        <h1>Comparación de retrieval SE vs SEM</h1>
        <p>Compara ambos modos de retrieval sobre un mismo símbolo de este Run. No altera el resultado operacional del Run.</p>
      </div>
      {isMock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    <div className="contract-note">
      <span className="contract-glyph">OE2</span>
      <div>
        <strong>SE y SEM no son equivalentes a RAG ni a GA</strong>
        <p>Son modos de retrieval experimentales. Esta vista no ofrece conclusiones comparativas.</p>
      </div>
    </div>

    <div className="panel">
      <div className="section-heading"><div><h2>Iniciar comparación</h2></div></div>

      {!eligibleSymbols.length && <div className="empty-state"><p>Este Run no tiene símbolos METHOD o FUNCTION con cambio directo. No hay comparación de retrieval posible para él.</p></div>}

      {eligibleSymbols.length > 0 && roleLoading && <p>Comprobando tu rol en el Project…</p>}

      {eligibleSymbols.length > 0 && !roleLoading && !canWrite && <p className="role-note">Solo un Writer, Maintainer o Admin puede crear comparaciones de retrieval. Puedes ver las comparaciones previas.</p>}

      {eligibleSymbols.length > 0 && !roleLoading && canWrite && <>
        <div className="field">
          <label htmlFor="retrieval-symbol">Símbolo a comparar</label>
          <select id="retrieval-symbol" value={selectedKey} onChange={(event) => onSelectSymbol(event.target.value)} aria-describedby="retrieval-symbol-hint">
            <option value="">Elige un símbolo</option>
            {eligibleSymbols.map((symbol) => <option key={symbolKey(symbol)} value={symbolKey(symbol)}>{symbol.qualifiedName} · {symbol.kind} · {symbol.filePath}</option>)}
          </select>
          <span id="retrieval-symbol-hint" className="field-hint">{selectedSymbol ? `Símbolo elegido: ${selectedSymbol.qualifiedName}` : 'Elige un símbolo para habilitar la comparación.'}</span>
        </div>
        <div className="run-actions">
          <button type="button" className="button primary" disabled={!canStart} aria-describedby="retrieval-start-hint" onClick={onStart}>
            {startMutation.isPending ? 'Comparando…' : terminal && selectedSymbol && activeId && detail?.symbol.qualifiedName === selectedSymbol.qualifiedName ? 'Comparar de nuevo' : 'Comparar retrieval SE vs SEM'}
          </button>
          <span id="retrieval-start-hint" className="field-hint">
            {!selectedSymbol ? 'Motivo: falta elegir un símbolo.' : startMutation.isPending ? 'Motivo: la comparación se está creando.' : 'Lista para comparar el símbolo elegido.'}
          </span>
        </div>
        {startMutation.isError && <ErrorNote message={bindingErrorMessage(startMutation.error)} correlationId={errorCorrelationId(startMutation.error)} />}
      </>}
    </div>

    <h2>Estado de la comparación</h2>
    {/* Contenedor de estado único: siempre montado; solo cambia su texto. */}
    <div role="status" className="panel experiment-progress">
      <span>{statusMessage}</span>
      {activeId && detail && (detail.status === 'PENDING' || detail.status === 'RUNNING') && <strong>{STATUS_TEXT[detail.status]}</strong>}
    </div>
    {detail?.status === 'FAILED' && <ErrorNote message={`Comparación fallida. ${retrievalFailureText(detail.failureCode)} failureCode: ${detail.failureCode ?? 'sin código'} · failureMessage: ${detail.failureMessage ?? 'sin mensaje'}`} />}
    {detailQuery.isError && <ErrorNote message={bindingErrorMessage(detailQuery.error)} correlationId={errorCorrelationId(detailQuery.error)} />}
    {/* Un 409 RETRIEVAL_COMPARISON_FAILED de /results no se reintenta: el detalle es el del status (bloque de arriba). */}
    {resultsQuery.isError && <ErrorNote message={bindingErrorMessage(resultsQuery.error)} correlationId={errorCorrelationId(resultsQuery.error)} />}

    {results && <div className="panel">
      <h2 ref={resultHeadingRef} tabIndex={-1} className="retrieval-result-heading">Resultado de {results.symbol.qualifiedName}</h2>
      <div className="retrieval-modes">
        {results.modes.map((mode) => <RetrievalModeView key={mode.mode} mode={mode} />)}
      </div>
    </div>}

    {activeId && terminal && detail?.id === activeId && <div className="panel evidence-panel">
      <div className="section-heading"><div><h2>Evidencia versionada</h2><p>Descarga el paquete técnico de esta comparación tal como lo devuelve Core.</p></div></div>
      <EvidenceDownload kind="RETRIEVAL_COMPARISON" subjectId={activeId} terminal />
    </div>}

    <h2>Comparaciones previas del Run</h2>
    <div className="panel">
      {listQuery.isPending && <p>Cargando comparaciones previas…</p>}
      {listQuery.isError && <ErrorNote message={bindingErrorMessage(listQuery.error)} correlationId={errorCorrelationId(listQuery.error)} />}
      {listQuery.isSuccess && previous.length === 0 && <p>Todavía no hay comparaciones de retrieval en este Run.</p>}
      {previous.length > 0 && <ul className="retrieval-previous" aria-label="Comparaciones previas del Run">
        {previous.map((item) => <li key={item.id}>
          <span><strong>{item.symbol.qualifiedName}</strong> · <code>{item.id}</code></span>
          <span>Estado: {STATUS_TEXT[item.status]} ({item.status})</span>
          {item.status === 'FAILED' && <span>{retrievalFailureText(item.failureCode)} failureCode: <code>{item.failureCode ?? 'sin código'}</code> · failureMessage: {item.failureMessage ?? 'sin mensaje'}</span>}
          {item.status === 'COMPLETED' && <button type="button" className="button secondary" onClick={() => onViewResult(item)}>Ver resultado<span className="visually-hidden"> de {item.symbol.qualifiedName}</span></button>}
        </li>)}
      </ul>}
      {listQuery.hasNextPage && <button type="button" className="button secondary" disabled={listQuery.isFetchingNextPage} onClick={() => void listQuery.fetchNextPage()}>Cargar más comparaciones</button>}
    </div>
  </section>
}

function RetrievalModeView({ mode }: { mode: RetrievalModeResultResponse }) {
  const isSE = mode.mode === 'SE'
  const metrics = mode.metrics
  return <article className="retrieval-mode">
    <h3>Modo {mode.mode}</h3>
    <div className="retrieval-table-wrap" role="region" tabIndex={0} aria-label={`Candidatos del modo ${mode.mode}`}>
    <table>
      <caption>Candidatos por ranking del modo {mode.mode}</caption>
      <thead>
        <tr>
          <th scope="col">Ranking</th>
          <th scope="col">Símbolo y archivo</th>
          <th scope="col">semanticScore</th>
          <th scope="col">structuralRelation</th>
          <th scope="col">combinedScore</th>
          <th scope="col">Selección</th>
        </tr>
      </thead>
      <tbody>
        {mode.candidates.map((candidate) => <tr key={candidate.chunkId}>
          <th scope="row">{candidate.rank}</th>
          <td><strong>{candidate.symbolQualifiedName ?? 'Sin símbolo'}</strong><br /><code>{candidate.filePath}</code></td>
          <td>{formatRetrievalScore(candidate.semanticScore)}</td>
          <td>{structuralRelationLabel(candidate.structuralRelation, mode.mode)}</td>
          <td>{isSE ? formatRetrievalScore(candidate.combinedScore) : NOT_APPLICABLE_LABEL}</td>
          <td>{candidate.selected ? 'Seleccionado' : 'No seleccionado'}</td>
        </tr>)}
      </tbody>
    </table>
    </div>

    <dl className="retrieval-config">
      <div><dt>semanticTopK</dt><dd>{String(mode.config.semanticTopK)}</dd></div>
      <div><dt>finalTopK</dt><dd>{formatConfigValue(mode.config.finalTopK)}</dd></div>
      <div><dt>semanticWeight</dt><dd>{formatConfigValue(mode.config.semanticWeight)}</dd></div>
      <div><dt>structuralWeight</dt><dd>{formatConfigValue(mode.config.structuralWeight)}</dd></div>
      <div><dt>embeddingModel</dt><dd>{mode.config.embeddingModel}</dd></div>
    </dl>

    <h3>Métricas del modo {mode.mode}</h3>
    <dl className="retrieval-metrics">
      <div><dt>P@5</dt><dd>{formatRetrievalMetric(metrics?.precisionAt5 ?? null)}</dd></div>
      <div><dt>R@5</dt><dd>{formatRetrievalMetric(metrics?.recallAt5 ?? null)}</dd></div>
      <div className="retrieval-metric-key"><dt><strong>P@10</strong></dt><dd><strong>{formatRetrievalMetric(metrics?.precisionAt10 ?? null)}</strong></dd></div>
      <div className="retrieval-metric-key"><dt><strong>R@10</strong></dt><dd><strong>{formatRetrievalMetric(metrics?.recallAt10 ?? null)}</strong></dd></div>
    </dl>
    {!metrics && <p className="field-hint">Este modo no tiene métricas disponibles en esta comparación.</p>}
  </article>
}
