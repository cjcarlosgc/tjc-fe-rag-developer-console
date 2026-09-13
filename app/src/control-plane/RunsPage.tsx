import { Link, useSearchParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { useAnalysisRuns } from './queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from './status'

/** HU32/HU39 — listado global de Analysis Runs (control plane PR-driven), opcionalmente filtrado por proyecto vía `?projectId=`. */
export function RunsPage() {
  const mock = isMockDataSource()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') ?? undefined
  const runsQuery = useAnalysisRuns(projectId)

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Runs' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Control plane / PR-driven</p>
        <h1>Runs</h1>
        <p>Un Analysis Run por PR/HEAD vigente. Un HEAD nuevo obsoleta al anterior.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>
    {runsQuery.isPending && <LoadingState label="Cargando Runs…" />}
    {runsQuery.isError && <ErrorState message={runsQuery.error.message} onRetry={() => void runsQuery.refetch()} />}
    {runsQuery.data && (runsQuery.data.items.length === 0
      ? <div className="empty-inline"><strong>Sin Runs</strong><p>Todavía no hay Analysis Runs para este filtro.</p></div>
      : <ul className="analysis-run-list">
          {runsQuery.data.items.map((run) => (
            <li key={run.id} className={`panel analysis-run-item${run.current ? '' : ' analysis-run-item-obsolete'}`}>
              <Link to={`/analysis-runs/${run.id}`}>
                <div className="analysis-run-item-heading">
                  <span className="pr-ref">{run.pullRequest.repositoryName} · PR #{run.pullRequest.number}</span>
                  <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
                  {!run.current && <span className="status-badge status-muted">NO VIGENTE</span>}
                </div>
                <p>{run.pullRequest.title}</p>
                <span className="card-link">
                  {run.actionRequiredCount > 0 ? `${run.actionRequiredCount} pregunta(s) pendiente(s)` : run.generatedTestsCount > 0 ? `${run.generatedTestsCount} prueba(s) generada(s)` : 'Ver detalle'} →
                </span>
              </Link>
            </li>
          ))}
        </ul>)}
  </section>
}
