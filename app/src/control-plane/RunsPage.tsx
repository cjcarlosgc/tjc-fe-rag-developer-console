import { Link, useSearchParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { useAllAnalysisRuns, useAnalysisRuns } from './queries'
import { useAllProjects } from '../projects/queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from './status'

/** HU32/HU39 — listado global de Analysis Runs (control plane PR-driven), opcionalmente filtrado por proyecto vía `?projectId=`. */
export function RunsPage() {
  const mock = isMockDataSource()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') ?? undefined
  const workspaceId = searchParams.get('workspaceId')
  const workspaceQuery = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
  const workspaceProjectsQuery = useAllProjects(workspaceId, Boolean(workspaceId))
  const workspaceProjectIds = new Set((workspaceProjectsQuery.data ?? []).map((project) => project.id))
  const hasProjectWorkspaceContext = Boolean(projectId && workspaceId)
  const projectBelongsToWorkspace = !hasProjectWorkspaceContext || workspaceProjectIds.has(projectId!)
  const projectScopeMismatch = Boolean(hasProjectWorkspaceContext && workspaceProjectsQuery.data && !projectBelongsToWorkspace)
  const projectScopeLoading = Boolean(hasProjectWorkspaceContext && workspaceProjectsQuery.isPending)
  const projectRunsQuery = useAnalysisRuns(projectId, undefined, Boolean(projectId) && projectBelongsToWorkspace)
  const globalRunsQuery = useAllAnalysisRuns(!projectId)
  const allRuns = projectId ? projectRunsQuery.data?.items : globalRunsQuery.data
  const visibleRuns = projectScopeMismatch ? undefined : allRuns?.filter((run) => !workspaceId || projectId || workspaceProjectIds.has(run.projectId))
  const scopedProjectsLoading = Boolean(workspaceId && !projectId && workspaceProjectsQuery.isPending)
  const scopedProjectsError = Boolean(workspaceId && !projectId && workspaceProjectsQuery.isError)
  const projectScopeError = Boolean(hasProjectWorkspaceContext && workspaceProjectsQuery.isError)
  const isPending = projectId ? projectScopeLoading || (!projectScopeMismatch && projectRunsQuery.isPending) : globalRunsQuery.isPending || scopedProjectsLoading
  const error = projectId ? workspaceProjectsQuery.error ?? projectRunsQuery.error : globalRunsQuery.error ?? workspaceProjectsQuery.error
  const isError = projectId ? projectScopeError || (!projectScopeMismatch && projectRunsQuery.isError) : globalRunsQuery.isError || scopedProjectsError
  const retry = () => {
    if (workspaceId && workspaceProjectsQuery.isError) void workspaceProjectsQuery.refetch()
    if (projectId) {
      if (projectBelongsToWorkspace) void projectRunsQuery.refetch()
    } else void globalRunsQuery.refetch()
  }

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: workspaceQuery ? `/${workspaceQuery}` : '/' }, { label: 'Runs' }]} />
    {projectId && <ProjectTabs projectId={projectId} />}
    <div className="page-heading">
      <div>
        <p className="eyebrow">Control plane / PR-driven</p>
        <h1>Runs</h1>
        <p>Un Analysis Run por PR/HEAD vigente. Un HEAD nuevo obsoleta al anterior.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
      </div>
      {projectScopeMismatch && <div className="feedback error-state" role="alert">
        <strong>Project fuera del workspace seleccionado</strong>
        <p>El Project no está disponible dentro de este workspace.</p>
        <Link className="button secondary button-link" to={`/${workspaceQuery}`}>Volver a Projects</Link>
      </div>}
    {isPending && !isError && <LoadingState label="Cargando Runs…" />}
    {isError && <ErrorState message={error?.message ?? 'No se pudieron cargar los Projects de este workspace.'} onRetry={retry} />}
    {!projectScopeMismatch && !isPending && !isError && visibleRuns && (visibleRuns.length === 0
      ? <div className="empty-inline"><strong>Sin Runs</strong><p>Todavía no hay Analysis Runs para este filtro.</p></div>
      : <ul className="analysis-run-list">
          {visibleRuns.map((run) => (
            <li key={run.id} className={`panel analysis-run-item${run.current ? '' : ' analysis-run-item-obsolete'}`}>
              <Link to={`/projects/${run.projectId}/runs/${run.id}${workspaceQuery}`}>
                <div className="analysis-run-item-heading">
                  <RepoChip repositoryName={run.pullRequest.repositoryName} />
                  <span className="pr-ref">PR #{run.pullRequest.number}</span>
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
