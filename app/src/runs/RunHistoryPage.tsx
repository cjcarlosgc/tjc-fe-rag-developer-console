import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { formatDate } from '../formatting'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { listTestRunHistory } from './api'
import type { RunStatus } from './types'

const modeLabels: Record<string, string> = {
  TARGET: 'Target puntual',
  CLASS_ALL: 'Clase completa',
  CLASS_MISSING: 'Faltantes de clase',
  PROJECT_MISSING: 'Faltantes del proyecto',
  PROJECT_ALL: 'Proyecto completo',
}

type StatusFilter = 'ALL' | RunStatus

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'COMPLETED', label: 'Completados' },
  { value: 'PARTIAL', label: 'Parciales' },
  { value: 'FAILED', label: 'Fallidos' },
]

export function RunHistoryPage() {
  const { projectId = '', projectVersionId: requestedVersionId } = useParams()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const projectQuery = useProject(projectId)
  const projectVersionId = requestedVersionId ?? projectQuery.data?.currentVersionId ?? null
  const historyQuery = useInfiniteQuery({
    queryKey: ['runs', 'history', projectVersionId],
    queryFn: ({ pageParam }) => listTestRunHistory(projectVersionId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(projectVersionId),
  })

  const runs = useMemo(() => historyQuery.data?.pages.flatMap((page) => page.items) ?? [], [historyQuery.data])
  const filteredRuns = useMemo(() => statusFilter === 'ALL' ? runs : runs.filter((run) => run.status === statusFilter), [runs, statusFilter])

  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (!projectVersionId) return <div className="empty-inline"><strong>Este proyecto todavía no tiene una versión lista</strong><p>Carga e indexa un ZIP antes de consultar el historial de generaciones.</p></div>
  if (historyQuery.isPending) return <LoadingState label="Cargando historial de generaciones…" />
  if (historyQuery.isError) return <ErrorState message={historyQuery.error.message} onRetry={() => void historyQuery.refetch()} />

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data.name, to: `/projects/${projectId}` }, { label: 'Historial de generaciones' }]} />
    <div className="page-heading"><div><p className="eyebrow">ProjectVersion {projectVersionId}</p><h1>Historial de generaciones</h1><p>Cada generation run de esta versión, con su estado y conteo de targets.</p></div>{isMockDataSource() && <span className="demo-stamp">DEMO TIMELINE</span>}</div>
    {runs.length === 0 ? <div className="empty-state"><div className="empty-icon">∅</div><h2>Sin generaciones registradas</h2><p>Configura una generación para esta versión.</p><Link className="button primary button-link" to={`/projects/${projectId}/generate`}>Configurar generación</Link></div> : <div className="inventory-stack"><div className="panel inventory-panel"><div className="list-toolbar"><fieldset className="segmented"><legend>Estado</legend>{statusFilters.map(({ value, label }) => <button type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} key={value}>{label}</button>)}</fieldset></div>{filteredRuns.length === 0 ? <div className="empty-inline"><strong>Sin runs con este estado</strong><p>Ajusta el filtro para ver otras generaciones.</p></div> : <div className="table-frame"><table><thead><tr><th>Run</th><th>Modo</th><th>Estado</th><th>Targets</th><th>Creado</th></tr></thead><tbody>{filteredRuns.map((run) => <tr key={run.id}><td><Link to={`/projects/${projectId}/legacy/runs/${run.id}`}><code>{run.id}</code></Link></td><td>{modeLabels[run.mode] ?? run.mode}</td><td><span className={`run-status status-${run.status.toLowerCase()}`}>{run.status}</span></td><td>{run.validTargets} válidos · {run.invalidTargets} inválidos{run.failedTargets ? ` · ${run.failedTargets} fallidos` : ''} / {run.totalTargets ?? '—'}</td><td>{formatDate(run.completedAt ?? run.createdAt)}</td></tr>)}</tbody></table></div>}</div></div>}
    {historyQuery.hasNextPage && <div className="run-actions"><button className="button secondary" type="button" disabled={historyQuery.isFetchingNextPage} onClick={() => void historyQuery.fetchNextPage()}>{historyQuery.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}</button></div>}
  </section>
}
