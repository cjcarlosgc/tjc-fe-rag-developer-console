import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { formatDate } from '../formatting'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { listAnalysisHistory } from './api'

const metric = (value: number | null) => value ?? '—'

export function AnalysisHistoryPage() {
  const { projectId = '' } = useParams()
  const projectQuery = useProject(projectId)
  const historyQuery = useQuery({ queryKey: ['projects', projectId, 'analysis-history'], queryFn: () => listAnalysisHistory(projectId) })

  if (projectQuery.isPending || historyQuery.isPending) return <LoadingState label="Cargando historial de análisis…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (historyQuery.isError) return <ErrorState message={historyQuery.error.message} onRetry={() => void historyQuery.refetch()} />

  const versions = historyQuery.data
  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data.name, to: `/projects/${projectId}` }, { label: 'Historial de análisis' }]} />
    <ProjectTabs projectId={projectId} />
    <div className="page-heading analysis-history-heading"><div><p className="eyebrow">Snapshots del repositorio</p><h1>Historial de análisis</h1><p>{projectQuery.data.name} conserva snapshots derivados de PR y sus resultados técnicos.</p></div><div className="history-heading-meta"><strong>{versions.length}</strong><span>versiones<br />analizadas</span>{isMockDataSource() && <span className="demo-stamp">DEMO TIMELINE</span>}</div></div>
    {versions.length === 0 ? <div className="empty-state"><div className="empty-icon">∅</div><h2>Sin análisis registrados</h2><p>El historial comienza cuando un PR vinculado produce un snapshot.</p></div> : <ol className="analysis-timeline">{versions.map((version, index) => <li className={version.current ? 'current-version' : ''} key={version.id}>
      <div className="timeline-rail"><span>{String(versions.length - index).padStart(2, '0')}</span><i /></div>
      <article className="analysis-version-card">
        <header><div><div className="version-flags"><span className={`run-status status-${version.status.toLowerCase()}`}>{version.status}</span>{version.current && <span className="current-chip">VERSIÓN ACTUAL</span>}</div><h2>Snapshot de repositorio</h2><p><code>{version.id}</code> · {formatDate(version.completedAt ?? version.createdAt)}</p></div><span className="framework-mark">{version.detectedFramework ?? '—'}</span></header>
        <dl className="version-metrics"><div><dt>Archivos</dt><dd>{metric(version.filesProcessed)}</dd></div><div><dt>Chunks</dt><dd>{metric(version.chunksCount)}</dd></div><div><dt>Targets</dt><dd>{metric(version.targetsTotal)}</dd></div><div><dt>Con test</dt><dd>{metric(version.targetsWithTest)}</dd></div><div><dt>Sin test</dt><dd>{metric(version.targetsMissingTest)}</dd></div></dl>
        <footer><span>{version.current ? 'Base activa para nuevos análisis' : 'Snapshot histórico · sólo lectura'}</span>{version.status === 'COMPLETED' && <Link className="button secondary button-link" to={`/projects/${projectId}/versions/${version.id}/inventory`}>Ver inventario <span aria-hidden="true">→</span></Link>}</footer>
      </article>
    </li>)}</ol>}
  </section>
}
