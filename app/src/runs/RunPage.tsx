import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { getRun } from './api'
import { RunProgress } from './RunProgress'
import { ValidationResults } from './ValidationResults'
import { isTerminalRunStatus } from './types'

export function RunPage() {
  const { projectId = '', runId = '' } = useParams()
  const runQuery = useQuery({ queryKey: ['runs', runId], queryFn: () => getRun(runId), refetchInterval: (query) => query.state.data && isTerminalRunStatus(query.state.data.status) ? false : import.meta.env.MODE === 'test' ? 10 : 520 })

  if (runQuery.isPending) return <LoadingState label="Abriendo generation run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const run = runQuery.data
  const terminal = isTerminalRunStatus(run.status)
  return <section><Link className="back-link" to={`/projects/${projectId}`}>← Volver al proyecto</Link><div className="page-heading"><div><p className="eyebrow">Generation run</p><h1>Run {runId}</h1><p>Progreso y validación técnica por target.</p></div>{isMockDataSource() && <span className="demo-stamp">LIVE SIMULATION</span>}</div><RunProgress run={run} />{terminal && <><div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div><ValidationResults run={run} /><div className="run-actions"><Link className="button primary button-link" to={`/projects/${projectId}/runs/${runId}/artifacts`}>Revisar artifacts <span aria-hidden="true">→</span></Link></div></>}</section>
}
