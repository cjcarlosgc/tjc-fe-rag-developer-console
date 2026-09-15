import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ExperimentComparison } from '../experiments/ExperimentComparison'
import { useAnalysisRun } from '../control-plane/queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from '../control-plane/status'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { getRunComparison, startRunComparison } from './api'
import { findEligibleSymbol } from './types'

/**
 * INTEROP-2.1 §6.5 (HU48) — contrato definido, Core todavía no lo implementó
 * (ver spec/features/014-analysisrun-experiments/spec.md). Sin adapter live:
 * `run-comparison/api.ts` rechaza con `PendingContractError` en modo live.
 */
export function RunComparisonPage() {
  const { projectId = '', analysisRunId = '' } = useParams()
  const runQuery = useAnalysisRun(analysisRunId)
  const [comparisonId, setComparisonId] = useState<string | null>(null)
  const eligibleSymbol = runQuery.data ? findEligibleSymbol(runQuery.data.symbols) : null

  const startMutation = useMutation({
    mutationFn: (symbol: NonNullable<typeof eligibleSymbol>) => startRunComparison(analysisRunId, symbol),
    onSuccess: (accepted) => setComparisonId(accepted.comparisonId),
  })
  const comparisonQuery = useQuery({
    queryKey: ['run-comparison', comparisonId],
    queryFn: () => getRunComparison(comparisonId as string),
    enabled: Boolean(comparisonId),
    refetchInterval: (query) => query.state.data?.status === 'COMPLETED' ? false : import.meta.env.MODE === 'test' ? 10 : 560,
  })

  useEffect(() => {
    if (eligibleSymbol && !comparisonId && !startMutation.isPending && !startMutation.isError) startMutation.mutate(eligibleSymbol)
    // Se dispara una sola vez apenas hay símbolo elegible; no debe repetirse si el usuario navega y vuelve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleSymbol])

  if (runQuery.isPending) return <LoadingState label="Cargando Analysis Run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const run = runQuery.data
  const operation = comparisonQuery.data

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

    {!eligibleSymbol && (
      <div className="empty-state">
        <p>Ningún símbolo de este Run es <code>METHOD</code>/<code>FUNCTION</code> con cambio directo — HU48 solo admite esa unidad experimental. No hay una comparación posible para este Run.</p>
      </div>
    )}

    {eligibleSymbol && <>
      <div className="panel analysis-run-summary">
        <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
        <dl className="metadata">
          <div><dt>HEAD</dt><dd><code>{run.pullRequest.headSha}</code></dd></div>
          <div><dt>Símbolo</dt><dd>{eligibleSymbol.qualifiedName}</dd></div>
        </dl>
      </div>

      {startMutation.isError && <p className="inline-error" role="alert">{startMutation.error.message}</p>}

      {operation && (!operation.result || operation.status !== 'COMPLETED') && (
        <div className="experiment-progress" role="status">
          <div><span className="live-indicator" /><strong>{operation.status === 'RUNNING' ? 'Ejecutando estrategias pareadas' : 'Preparando comparación'}</strong><p>Comparación <code>{operation.id}</code></p></div>
          <span>{operation.progress}%</span>
          <i><b style={{ width: `${operation.progress}%` }} /></i>
        </div>
      )}

      {operation?.status === 'COMPLETED' && operation.result && (
        <>
          <div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div>
          <ExperimentComparison result={operation.result} projectId={projectId} experimentId={operation.id} />
        </>
      )}
    </>}
  </section>
}
