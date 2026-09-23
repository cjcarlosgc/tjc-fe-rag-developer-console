import { Link, useSearchParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { useAllActionRequiredList } from './queries'
import { useAllProjects } from '../projects/queries'

/** HU38 — bandeja de Runs con contexto funcional pendiente; cada fila abre Focus Mode con retorno seguro. */
export function ActionRequiredPage() {
  const mock = isMockDataSource()
  const [searchParams] = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  const returnTo = workspaceId ? `/action-required?workspaceId=${encodeURIComponent(workspaceId)}` : '/action-required'
  const listQuery = useAllActionRequiredList()
  const projectsQuery = useAllProjects(workspaceId, Boolean(workspaceId))
  const projectIds = new Set((projectsQuery.data ?? []).map((project) => project.id))
  const visibleItems = listQuery.data?.filter((item) => !workspaceId || projectIds.has(item.projectId))
  const isPending = listQuery.isPending || Boolean(workspaceId && projectsQuery.isPending)
  const error = listQuery.error ?? projectsQuery.error
  const isError = listQuery.isError || Boolean(workspaceId && projectsQuery.isError)
  const retry = () => {
    if (workspaceId && projectsQuery.isError) void projectsQuery.refetch()
    void listQuery.refetch()
  }

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: workspaceId ? `/?workspaceId=${encodeURIComponent(workspaceId)}` : '/' }, { label: 'Action Required' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Control plane / human-in-the-loop</p>
        <h1>Action Required</h1>
        <p>Runs que necesitan una respuesta funcional antes de continuar el análisis.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>
    {isPending && !isError && <LoadingState label="Cargando bandeja…" />}
    {isError && <ErrorState message={error?.message ?? 'No se pudieron cargar los Projects de este workspace.'} onRetry={retry} />}
    {!isPending && !isError && visibleItems && (visibleItems.length === 0
      ? <div className="empty-inline"><strong>Sin pendientes</strong><p>No hay Runs esperando contexto funcional en este momento.</p></div>
      : <ul className="action-required-list">
          {visibleItems.map((question) => (
            <li key={question.id} className="panel action-required-item">
              <Link to={`/action-required/${question.analysisRunId}?returnTo=${encodeURIComponent(returnTo)}${workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''}`}>
                <div className="action-required-item-heading">
                  <RepoChip repositoryName={question.repositoryName} />
                  <span className="pr-ref">PR #{question.pullRequestNumber}</span>
                  <span className="target-ref">{question.target.qualifiedName}</span>
                </div>
                <p>{question.question}</p>
                <span className="card-link">Abrir Focus Mode →</span>
              </Link>
            </li>
          ))}
        </ul>)}
  </section>
}
