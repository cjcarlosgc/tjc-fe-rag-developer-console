import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useIdempotencyKeys } from '../api/idempotency'
import { isMockDataSource } from '../api/dataSource'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { getRun, retryTarget } from './api'
import { runErrorMessage } from './errors'
import { RunProgress } from './RunProgress'
import { useRealtimeRun } from './useRealtimeRun'
import { ValidationResults } from './ValidationResults'
import { isTerminalRunStatus } from './types'

export function RunPage() {
  const { projectId = '', runId = '' } = useParams()
  const queryClient = useQueryClient()
  const projectQuery = useProject(projectId)
  const [retryError, setRetryError] = useState<string | null>(null)
  const idempotencyKeys = useIdempotencyKeys()
  const runQuery = useQuery({ queryKey: ['runs', runId], queryFn: () => getRun(runId), refetchInterval: (query) => query.state.data && isTerminalRunStatus(query.state.data.status) ? false : import.meta.env.MODE === 'test' ? 10 : 520 })
  useRealtimeRun(runId, runQuery.data?.status)

  const retryMutation = useMutation({
    mutationFn: (targetId: string) => retryTarget(runId, targetId, idempotencyKeys.getOrCreate(targetId)),
    onSuccess: (_accepted, targetId) => {
      idempotencyKeys.clear(targetId)
      setRetryError(null)
      void queryClient.invalidateQueries({ queryKey: ['runs', runId] })
    },
    onError: (error) => setRetryError(runErrorMessage(error)),
  })

  if (runQuery.isPending) return <LoadingState label="Abriendo generation run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const run = runQuery.data
  const terminal = isTerminalRunStatus(run.status)
  return <section><Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: 'Historial de generaciones', to: `/projects/${projectId}/runs` }, { label: `Run ${runId}` }]} /><div className="page-heading"><div><p className="eyebrow">Generation run</p><h1>Run {runId}</h1><p>Progreso y validación técnica por target.</p></div>{isMockDataSource() && <span className="demo-stamp">LIVE SIMULATION</span>}</div><RunProgress run={run} />{terminal && <><div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div>{run.failureMessage && <div className="structured-error" role="alert"><strong>El run falló antes de procesar targets</strong><p>{run.failureMessage}</p></div>}{retryError && <div className="structured-error" role="alert"><strong>No se pudo reintentar el target</strong><p>{retryError}</p></div>}<ValidationResults run={run} onRetry={(targetId) => retryMutation.mutate(targetId)} retryingTargetId={retryMutation.isPending ? retryMutation.variables ?? null : null} /><div className="run-actions"><Link className="button primary button-link" to={`/projects/${projectId}/runs/${runId}/artifacts`}>Revisar artifacts <span aria-hidden="true">→</span></Link><Link className="button secondary button-link" to={`/projects/${projectId}/runs/${runId}/context`}>Explorar contexto <span aria-hidden="true">→</span></Link></div></>}</section>
}
