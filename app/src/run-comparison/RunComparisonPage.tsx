import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ExperimentComparison } from '../experiments/ExperimentComparison'
import { useAnalysisRun } from '../control-plane/queries'
import { useProject } from '../projects/queries'
import { bindingErrorMessage, errorCorrelationId } from '../control-plane/errors'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from '../control-plane/status'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { getRunComparison, listRunComparisons, startRunComparison } from './api'
import { findEligibleSymbols } from './types'
import type { RunComparisonOperation } from './types'

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED'])

/** Un trial ("Replay") de la comparación: sondea su propio progreso sin tocar el de los demás trials del mismo Run. */
function TrialCard({ operation, projectId }: { operation: RunComparisonOperation; projectId: string }) {
  const comparisonQuery = useQuery({
    queryKey: ['run-comparison', operation.id],
    queryFn: () => getRunComparison(operation.id),
    placeholderData: operation,
    refetchInterval: (query) => TERMINAL_STATUSES.has(query.state.data?.status ?? '') ? false : import.meta.env.MODE === 'test' ? 10 : 560,
  })
  const current = comparisonQuery.data ?? operation

  return <div className="panel">
    <div className="section-heading">
      <div><h3>{current.symbol.qualifiedName}</h3><p><code>{current.id}</code></p></div>
      <span className={`status-badge ${current.status === 'COMPLETED' ? 'status-success' : current.status === 'FAILED' ? 'status-danger' : ''}`}>{current.status}</span>
    </div>

    {current.status !== 'COMPLETED' && (
      <div className="experiment-progress" role="status">
        <div><span className="live-indicator" /><strong>{current.status === 'RUNNING' ? 'Ejecutando estrategias pareadas' : 'Preparando comparación'}</strong></div>
        <span>{current.progress}%</span>
        <i><b style={{ width: `${current.progress}%` }} /></i>
      </div>
    )}

    {current.status === 'COMPLETED' && current.result && (
      <>
        <div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div>
        <ExperimentComparison result={current.result} projectId={projectId} experimentId={current.id} />
      </>
    )}
  </div>
}

/**
 * INTEROP-2.1 §6.5 (HU48) — contrato definido, Core todavía no lo implementó
 * (ver spec/features/014-analysisrun-experiments/spec.md). Sin adapter live:
 * `run-comparison/api.ts` rechaza con `PendingContractError` en modo live.
 * Permite más de un trial ("Replay"/"New comparison") sobre el mismo
 * `AnalysisRun`, y un selector de símbolo cuando el changeset tiene más de
 * uno elegible — con exactamente uno, el primer trial arranca solo.
 */
export function RunComparisonPage() {
  const { projectId = '', analysisRunId = '' } = useParams()
  const runQuery = useAnalysisRun(analysisRunId)
  const projectQuery = useProject(projectId)
  const queryClient = useQueryClient()
  const autoStartedRef = useRef(false)
  const [selectedQualifiedName, setSelectedQualifiedName] = useState('')

  const eligibleSymbols = runQuery.data ? findEligibleSymbols(runQuery.data.symbols) : []
  const canCreateExperiment = projectQuery.data?.role === 'ADMIN' || projectQuery.data?.role === 'MAINTAINER'
  const selectedSymbol = eligibleSymbols.find((symbol) => symbol.qualifiedName === selectedQualifiedName) ?? eligibleSymbols[0] ?? null

  const comparisonsQuery = useQuery({
    queryKey: ['run-comparison', 'list', analysisRunId],
    queryFn: () => listRunComparisons(analysisRunId),
    enabled: Boolean(analysisRunId),
  })
  const trials = comparisonsQuery.data?.items ?? []

  const startMutation = useMutation({
    mutationFn: (symbol: NonNullable<typeof selectedSymbol>) => startRunComparison(analysisRunId, symbol),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['run-comparison', 'list', analysisRunId] }),
  })

  useEffect(() => {
    if (eligibleSymbols.length === 1 && comparisonsQuery.isSuccess && trials.length === 0 && canCreateExperiment && !autoStartedRef.current && !startMutation.isPending && !startMutation.isError) {
      autoStartedRef.current = true
      startMutation.mutate(eligibleSymbols[0])
    }
    // Arranca una sola vez cuando hay un único símbolo elegible y todavía no hay trials; con más de
    // uno, el primer trial requiere elegir símbolo explícitamente — no debe repetirse tras eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleSymbols.length, comparisonsQuery.isSuccess, trials.length, canCreateExperiment])

  if (runQuery.isPending || projectQuery.isPending || comparisonsQuery.isPending) return <LoadingState label="Cargando Analysis Run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (comparisonsQuery.isError) return <ErrorState message={comparisonsQuery.error.message} onRetry={() => void comparisonsQuery.refetch()} />

  const run = runQuery.data

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Runs', to: '/analysis-runs' }, { label: `PR #${run.pullRequest.number}`, to: `/projects/${projectId}/runs/${analysisRunId}` }, { label: 'Run comparison' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Experimentación / Run comparison</p>
        <div className="run-heading-meta"><RepoChip repositoryName={run.pullRequest.repositoryName} /><span className="pr-number">PR #{run.pullRequest.number}</span></div>
        <h1>RAG <i>vs</i> Agente generalista sobre este Run</h1>
        <p>Comparación académica sobre el mismo HEAD, changeset y símbolos que ya validó el flujo operacional — no sustituye ni bloquea el resultado del Run.</p>
      </div>
    </div>

    <div className={`contract-note ${isMockDataSource() ? 'success-note' : ''}`}>
      <span className="contract-glyph">{isMockDataSource() ? 'DEMO' : 'API'}</span>
      <div>
        <strong>{isMockDataSource() ? 'Laboratorio simulado' : 'Ejecución live'}</strong>
        <p>HU48 (INTEROP-2.1 §6.5) ya define este contrato, pero Core todavía no implementó el controller — las métricas son narrativas y no constituyen evidencia de tesis.</p>
      </div>
    </div>

    {!eligibleSymbols.length && (
      <div className="empty-state">
        <p>Ningún símbolo de este Run es <code>METHOD</code>/<code>FUNCTION</code> con cambio directo — HU48 solo admite esa unidad experimental. No hay una comparación posible para este Run.</p>
      </div>
    )}

    {eligibleSymbols.length > 0 && <>
      <div className="panel analysis-run-summary">
        <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
        <dl className="metadata">
          <div><dt>HEAD</dt><dd><code>{run.pullRequest.headSha}</code></dd></div>
          {eligibleSymbols.length === 1 && <div><dt>Símbolo</dt><dd>{eligibleSymbols[0].qualifiedName}</dd></div>}
        </dl>
      </div>

      <div className="panel">
        <div className="section-heading"><div><h2>{trials.length === 0 ? 'Iniciar comparación' : 'Nueva comparación'}</h2><p>Repite la comparación cuantas veces quieras sobre el mismo HEAD ("Replay") — cada trial queda listado abajo, sin perder los anteriores.</p></div></div>
        {eligibleSymbols.length > 1 && (
          <div className="field">
            <label htmlFor="comparison-symbol">Símbolo</label>
            <select id="comparison-symbol" value={selectedSymbol?.qualifiedName ?? ''} onChange={(event) => setSelectedQualifiedName(event.target.value)}>
              {eligibleSymbols.map((symbol) => <option key={symbol.qualifiedName} value={symbol.qualifiedName}>{symbol.qualifiedName} · {symbol.kind}</option>)}
            </select>
          </div>
        )}
        {canCreateExperiment ? <div className="run-actions">
          <button type="button" className="button primary" disabled={!selectedSymbol || startMutation.isPending} onClick={() => selectedSymbol && startMutation.mutate(selectedSymbol)}>
            {startMutation.isPending ? 'Creando comparación…' : trials.length === 0 ? 'Iniciar comparación' : 'Repetir comparación (Replay)'}
          </button>
        </div> : <p className="empty-inline-note">Tu rol es de solo lectura; un Maintainer o Admin puede crear comparaciones.</p>}
        {startMutation.isError && <p className="inline-error" role="alert">{bindingErrorMessage(startMutation.error)}{errorCorrelationId(startMutation.error) && <> · Correlation ID: <code>{errorCorrelationId(startMutation.error)}</code></>}</p>}
      </div>

      {trials.slice().reverse().map((trial) => <TrialCard key={trial.id} operation={trial} projectId={projectId} />)}
    </>}
  </section>
}
