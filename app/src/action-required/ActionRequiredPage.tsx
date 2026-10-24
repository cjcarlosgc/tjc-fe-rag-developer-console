import { Link, useSearchParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { useAllActionRequiredList } from './queries'
import { abstentionLabel } from './abstention'
import { RuleTargetSummary } from './RuleTargetSummary'
import { useAllProjects } from '../projects/queries'
import { EmptyState } from '../ui/EmptyState'
import { PageHeader } from '../ui/PageHeader'

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

  return (
    <section>
      <Breadcrumbs
        items={[
          { label: 'Projects', to: workspaceId ? `/?workspaceId=${encodeURIComponent(workspaceId)}` : '/' },
          { label: 'Action Required' },
        ]}
      />
      <PageHeader
        eyebrow="Plano de control / intervención humana"
        title="Action Required"
        description="Runs que necesitan una respuesta funcional antes de continuar el análisis."
        aside={mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
      />
      {/* WI-CONSOLE-047 (ciclo 2, H2): el ámbito del contador del menú (todos los Workspaces o el filtrado) también es visible, no solo título/aria. */}
      <p className="empty-inline-note">{workspaceId ? 'Pendientes del Workspace seleccionado.' : 'Pendientes en todos tus Workspaces.'}</p>
      {isPending && !isError && <LoadingState label="Cargando bandeja…" />}
      {isError && <ErrorState message={error?.message ?? 'No se pudieron cargar los Projects de este workspace.'} onRetry={retry} />}
      {!isPending &&
        !isError &&
        visibleItems &&
        (visibleItems.length === 0 ? (
          <EmptyState title="Sin pendientes" description="No hay Runs esperando contexto funcional en este momento." />
        ) : (
          <ul className="action-required-list">
            {visibleItems.map((question) => (
              <li key={question.id} className="panel action-required-item">
                <Link
                  to={`/action-required/${question.analysisRunId}?returnTo=${encodeURIComponent(returnTo)}${workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''}`}
                >
                  <div className="action-required-item-heading">
                    <RepoChip repositoryName={question.repositoryName} />
                    <span className="pr-ref">PR #{question.pullRequestNumber}</span>
                  </div>
                  <p>{question.question}</p>
                  <RuleTargetSummary target={question.target} scenarioKind={question.scenarioKind} />
                  {question.abstention && <p className="abstention-note">{abstentionLabel(question.abstention)}</p>}
                  <span className="card-link">Abrir Focus Mode →</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
