import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAllActionRequiredList } from '../action-required/queries'
import type { FunctionalQuestionResponse } from '../action-required/types'
import { ApiError } from '../api/client'
import { isMockDataSource } from '../api/dataSource'
import { useAllAnalysisRuns, useRepositoryBinding } from '../control-plane/queries'
import { bindingErrorMessage, errorCorrelationId } from '../control-plane/errors'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from '../control-plane/status'
import type { AnalysisRunSummaryResponse } from '../control-plane/types'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { formatRelativeAge } from '../ui/relativeTime'
import { CreateProjectForm } from './CreateProjectForm'
import { useAllProjects, useProjects, useWorkspaces } from './queries'
import type { Project, Workspace } from './types'
import { countActivePullRequests, countRunsCreatedSince, latestRunByProject } from './workspaceOverview'

const RECENT_ACTIVITY_LIMIT = 6
const ACTION_REQUIRED_PREVIEW_LIMIT = 3
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const EMPTY_RUNS: AnalysisRunSummaryResponse[] = []
const EMPTY_ACTION_REQUIRED: FunctionalQuestionResponse[] = []
const EMPTY_PROJECTS: Project[] = []

/** Nombre del proyecto recién eliminado, pasado por el `state` de navegación de react-router (HU56): un aviso de una sola vez, nunca persistido. */
function deletedProjectNameFrom(state: unknown): string | null {
  const name = (state as { deletedProjectName?: unknown } | null)?.deletedProjectName
  return typeof name === 'string' ? name : null
}

function ConnectRepositoryPanel({ onClose, workspace }: { onClose: () => void; workspace: Workspace }) {
  const navigate = useNavigate()
  return (
    <div className="panel create-panel">
      <div className="section-heading">
        <div>
          <h2>Crear Project en {workspace.kind === 'PERSONAL' ? 'tu cuenta personal' : workspace.login}</h2>
          <p>Nombra el Project; después configuras la GitHub App y el binding con el repositorio.</p>
        </div>
        <button type="button" className="button secondary" onClick={onClose}>Cerrar</button>
      </div>
      <CreateProjectForm workspace={workspace} onCreated={(id) => navigate(`/projects/${id}/integrations/github?workspaceId=${encodeURIComponent(workspace.id)}`)} />
    </div>
  )
}

function ActionRequiredPreview({ items, workspaceId }: { items: FunctionalQuestionResponse[]; workspaceId: string }) {
  const workspaceQuery = `workspaceId=${encodeURIComponent(workspaceId)}`
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <h2>Requieren tu atención</h2>
          <p>Runs esperando una respuesta funcional antes de continuar el análisis.</p>
        </div>
        <Link className="card-link" to={`/action-required?${workspaceQuery}`}>Ver todos →</Link>
      </div>
      {items.length === 0 ? (
        <div className="empty-inline">
          <strong>✓ No tienes acciones pendientes.</strong>
          <p>Todos los análisis pueden continuar sin intervención humana.</p>
        </div>
      ) : (
        <ul className="action-required-list">
          {items.slice(0, ACTION_REQUIRED_PREVIEW_LIMIT).map((question) => (
            <li key={question.id} className="panel action-required-item">
              <Link to={`/action-required/${question.analysisRunId}?returnTo=${encodeURIComponent(`/?${workspaceQuery}`)}&${workspaceQuery}`}>
                <div className="action-required-item-heading">
                  <RepoChip repositoryName={question.repositoryName} />
                  <span className="pr-ref">PR #{question.pullRequestNumber}</span>
                  <span className="target-ref">{question.target.qualifiedName}</span>
                </div>
                <p>{question.question}</p>
                <span className="card-link">Responder →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ProjectOverviewCardProps {
  project: Project
  runsForProject: AnalysisRunSummaryResponse[] | null
  actionRequiredCount: number | null
  runsLoading?: boolean
}

export function ProjectOverviewCard({ project, runsForProject, actionRequiredCount, runsLoading = false }: ProjectOverviewCardProps) {
  const bindingQuery = useRepositoryBinding(project.id)
  const binding = bindingQuery.data ?? null

  if (bindingQuery.isPending) {
    return (
      <div className="project-card">
        <div><span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span><h2>{project.name}</h2></div>
        <p>Cargando integración…</p>
      </div>
    )
  }

  if (bindingQuery.isError) {
    return (
      <div className="project-card">
        <div><span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span><h2>{project.name}</h2></div>
        <ErrorState message={bindingErrorMessage(bindingQuery.error)} correlationId={errorCorrelationId(bindingQuery.error)} onRetry={() => void bindingQuery.refetch()} />
      </div>
    )
  }

  if (!binding) {
    return (
      <Link className="project-card" to={`/projects/${project.id}/integrations/github?workspaceId=${encodeURIComponent(project.workspace.id)}`}>
        <div>
          <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
          <h2>{project.name}</h2>
          <span className="status-badge status-muted">NOT CONNECTED</span>
        </div>
        <p className="workspace-project-meta"><span>{project.workspace.login ?? 'Cuenta personal'}</span><span className="status-badge status-muted">{project.role}</span></p>
        <p>Todavía no hay un repositorio GitHub vinculado a este Project. Conecta un repositorio para analizar automáticamente los Pull Requests dirigidos a la rama de integración.</p>
        <span className="card-link">Configurar GitHub →</span>
      </Link>
    )
  }

  if (binding.status !== 'ENABLED') {
    const revoked = binding.status === 'REVOKED'
    return (
      <Link className="project-card" to={`/projects/${project.id}/integrations/github?workspaceId=${encodeURIComponent(project.workspace.id)}`}>
        <div>
          <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
          <h2>{project.name}</h2>
          <span className={`status-badge ${revoked ? 'status-danger' : 'status-warn'}`}>{revoked ? 'Revocado' : 'Pausado'}</span>
        </div>
        <p className="workspace-project-meta"><span>{project.workspace.login ?? 'Cuenta personal'}</span><span className="status-badge status-muted">{project.role}</span></p>
        <p>{revoked ? 'La GitHub App perdió acceso al repositorio. No se procesarán nuevos Pull Requests hasta reactivar el vínculo.' : 'El vínculo con GitHub está pausado. No se procesarán nuevos Pull Requests hasta reactivarlo.'}</p>
        <span className="card-link">Revisar integración →</span>
      </Link>
    )
  }

  const activePrs = runsForProject === null ? null : countActivePullRequests(runsForProject)
  const latestRun = runsForProject === null ? undefined : latestRunByProject(runsForProject).get(project.id)

  return (
    <Link className="project-card" to={`/projects/${project.id}?workspaceId=${encodeURIComponent(project.workspace.id)}`}>
      <div>
        <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
        <h2>{project.name}</h2>
        <span className="status-badge status-success">CONNECTED</span>
      </div>
      <p className="workspace-project-meta"><span>{project.workspace.login ?? 'Cuenta personal'}</span><span className="status-badge status-muted">{project.role}</span></p>
      <p><RepoChip repositoryName={binding.repositoryName} /></p>
      <p>Integration branch <code>{binding.integrationBranch}</code></p>
      <dl className="project-stats">
        <div><dt>Active PRs</dt><dd>{activePrs ?? '—'}</dd></div>
        <div><dt>Action Required</dt><dd>{actionRequiredCount ?? '—'}</dd></div>
      </dl>
      {runsForProject === null ? (
        <p>{runsLoading ? 'Cargando actividad de análisis…' : 'Actividad de análisis no disponible.'}</p>
      ) : latestRun ? (
        <p>
          Latest: PR #{latestRun.pullRequest.number} · <span className={`status-badge ${analysisRunStatusClass(latestRun.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[latestRun.status]}</span> · {formatRelativeAge(latestRun.createdAt)}
        </p>
      ) : (
        <p>Sin análisis todavía.</p>
      )}
      <span className="card-link">Abrir proyecto →</span>
    </Link>
  )
}

export function ProjectsPage() {
  const mock = isMockDataSource()
  const workspacesQuery = useWorkspaces()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedWorkspaceId = searchParams.get('workspaceId')
  const workspaces = workspacesQuery.data?.items ?? []
  const workspace = workspaces.find((item) => item.id === requestedWorkspaceId) ?? workspaces[0]
  const canCreateProject = workspace?.kind === 'PERSONAL' || workspace?.role === 'ADMIN'
  const projectsQuery = useProjects(workspace?.id ?? null, !workspacesQuery.isError)
  const allProjectsQuery = useAllProjects(workspace?.id ?? null, !workspacesQuery.isError)
  const runsQuery = useAllAnalysisRuns(Boolean(workspace) && !workspacesQuery.isError)
  const actionRequiredQuery = useAllActionRequiredList(Boolean(workspace) && !workspacesQuery.isError)
  const [query, setQuery] = useState('')
  const [showConnectPanel, setShowConnectPanel] = useState(false)
  const [now] = useState(() => Date.now())
  const location = useLocation()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [deletedProjectName] = useState(() => deletedProjectNameFrom(location.state))

  useEffect(() => {
    if (!workspace || requestedWorkspaceId === workspace.id) return
    const next = new URLSearchParams(searchParams)
    next.set('workspaceId', workspace.id)
    setSearchParams(next, { replace: true })
  }, [requestedWorkspaceId, searchParams, setSearchParams, workspace])

  // Tras eliminar un proyecto se llega aquí: el foco va al h1 y el `state` se limpia, porque `history.state` sobrevive a una recarga y el aviso no debe repetirse.
  useEffect(() => {
    if (!deletedProjectNameFrom(location.state)) return
    headingRef.current?.focus()
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  const projects = useMemo(() => projectsQuery.data?.pages.flatMap((page) => page.items) ?? [], [projectsQuery.data])
  const allProjects = allProjectsQuery.data ?? EMPTY_PROJECTS
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(query.trim().toLowerCase())),
    [projects, query],
  )
  const projectIds = useMemo(() => new Set(allProjects.map((project) => project.id)), [allProjects])
  const runs = useMemo(() => (runsQuery.data ?? EMPTY_RUNS).filter((run) => projectIds.has(run.projectId)), [projectIds, runsQuery.data])
  const actionRequiredItems = useMemo(() => (actionRequiredQuery.data ?? EMPTY_ACTION_REQUIRED).filter((item) => projectIds.has(item.projectId)), [actionRequiredQuery.data, projectIds])
  const workspaceProjectsResolved = Boolean(allProjectsQuery.data)
  const runsResolved = workspaceProjectsResolved && Boolean(runsQuery.data)
  const actionRequiredResolved = workspaceProjectsResolved && Boolean(actionRequiredQuery.data)
  const analysisAggregatesLoading = Boolean(workspace && (
    (!allProjectsQuery.isError && allProjectsQuery.isPending) ||
    (!runsQuery.isError && runsQuery.isPending) ||
    (!actionRequiredQuery.isError && actionRequiredQuery.isPending)
  ))
  const runsAggregateLoading = Boolean(workspace && !allProjectsQuery.isError && !runsQuery.isError && (!workspaceProjectsResolved || runsQuery.isPending))
  const projectListError = projectsQuery.error ?? allProjectsQuery.error
  const hasProjectListError = projectsQuery.isError || allProjectsQuery.isError

  const activePrCount = runsResolved ? countActivePullRequests(runs) : null
  const runsThisWeek = runsResolved ? countRunsCreatedSince(runs, new Date(now - SEVEN_DAYS_MS).toISOString()) : null
  const actionRequiredCount = actionRequiredResolved ? actionRequiredItems.length : null
  const actionRequiredByProject = useMemo(() => {
    const counts = new Map<string, number>()
    for (const question of actionRequiredItems) counts.set(question.projectId, (counts.get(question.projectId) ?? 0) + 1)
    return counts
  }, [actionRequiredItems])
  const runsByProject = useMemo(() => {
    const grouped = new Map<string, AnalysisRunSummaryResponse[]>()
    for (const run of runs) grouped.set(run.projectId, [...(grouped.get(run.projectId) ?? []), run])
    return grouped
  }, [runs])

  const retryProjectData = () => {
    const workspaceNotFound = [projectsQuery.error, allProjectsQuery.error].some(
      (error) => error instanceof ApiError && error.code === 'WORKSPACE_NOT_FOUND',
    )
    if (workspaceNotFound) {
      void workspacesQuery.refetch().then(({ data }) => {
        if (!workspace || !data?.items.some((item) => item.id === workspace.id)) return
        if (projectsQuery.isError) void projectsQuery.refetch()
        if (allProjectsQuery.isError) void allProjectsQuery.refetch()
      })
      return
    }
    if (projectsQuery.isError) void projectsQuery.refetch()
    if (allProjectsQuery.isError) void allProjectsQuery.refetch()
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace / Overview</p>
          <h1 ref={headingRef} tabIndex={-1}>Proyectos</h1>
          <p>Supervisa tus repositorios conectados, Pull Requests y análisis que requieren atención.</p>
        </div>
        <button type="button" className="button primary" disabled={!canCreateProject || workspacesQuery.isPending} aria-describedby={!canCreateProject ? 'workspace-create-hint' : undefined} onClick={() => setShowConnectPanel((value) => !value)}>+ Conectar repositorio</button>
      </div>

      <div className="workspace-toolbar panel">
        <div className="field">
          <label htmlFor="workspace-select">Workspace</label>
          <select id="workspace-select" value={workspace?.id ?? ''} disabled={workspacesQuery.isPending || workspaces.length === 0} onChange={(event) => {
            const next = new URLSearchParams(searchParams)
            next.set('workspaceId', event.target.value)
            setSearchParams(next)
            setShowConnectPanel(false)
          }}>
            {workspaces.map((item) => <option key={item.id} value={item.id}>{item.kind === 'PERSONAL' ? `Cuenta personal · ${item.login ?? 'tu cuenta'}` : `Organización · ${item.login ?? item.id}`}</option>)}
          </select>
        </div>
        {workspace && <div className="workspace-summary"><span className="status-badge status-muted">{workspace.role}</span><p>{workspace.kind === 'PERSONAL' ? 'Tus Projects personales solo son visibles para ti.' : workspace.role === 'ADMIN' ? 'Puedes administrar Projects de esta organización.' : 'Puedes acceder según tus permisos de repositorio; solo un owner crea Projects.'}</p></div>}
      </div>
      {!canCreateProject && workspace && <p id="workspace-create-hint" className="empty-inline-note">Solo un owner activo de {workspace.login} puede crear Projects en esta organización.</p>}

      {deletedProjectName && <p className="panel success-note" role="status">Proyecto «{deletedProjectName}» eliminado</p>}

      {showConnectPanel && workspace && canCreateProject && <ConnectRepositoryPanel workspace={workspace} onClose={() => setShowConnectPanel(false)} />}

      <div className="kpi-grid">
        <div className="kpi-card"><strong>{allProjectsQuery.data?.length ?? '—'}</strong><span>Proyectos</span></div>
        <div className="kpi-card"><strong>{activePrCount ?? '—'}</strong><span>PR activos</span></div>
        <div className={`kpi-card${(actionRequiredCount ?? 0) > 0 ? ' kpi-card-alert' : ''}`}><strong>{actionRequiredCount ?? '—'}</strong><span>Action Required</span></div>
        <div className="kpi-card"><strong>{runsThisWeek ?? '—'}</strong><span>Runs esta semana</span></div>
      </div>

      {analysisAggregatesLoading && <LoadingState label="Cargando actividad y pendientes del workspace…" />}
      {actionRequiredResolved && workspace && <ActionRequiredPreview items={actionRequiredItems} workspaceId={workspace.id} />}
      {workspaceProjectsResolved && actionRequiredQuery.isError && <ErrorState message={bindingErrorMessage(actionRequiredQuery.error)} correlationId={errorCorrelationId(actionRequiredQuery.error)} onRetry={() => void actionRequiredQuery.refetch()} />}

      {workspacesQuery.isPending && <LoadingState label={mock ? 'Preparando workspaces demo…' : 'Cargando workspaces…'} />}
      {workspacesQuery.isError && <ErrorState message={bindingErrorMessage(workspacesQuery.error)} correlationId={errorCorrelationId(workspacesQuery.error)} onRetry={() => void workspacesQuery.refetch()} />}
      {projectsQuery.isPending && !workspacesQuery.isPending && workspace && <LoadingState label={mock ? 'Preparando proyectos demo…' : 'Cargando proyectos…'} />}
      {hasProjectListError && <ErrorState message={bindingErrorMessage(projectListError)} correlationId={errorCorrelationId(projectListError)} onRetry={retryProjectData} />}
      {projectsQuery.data && (
        <div className="panel">
          <div className="section-heading"><div><h2>Proyectos conectados</h2></div></div>
          {projects.length > 4 && (
            <div className="field list-search">
              <label htmlFor="project-query">Buscar proyecto</label>
              <input id="project-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="nombre del proyecto" />
            </div>
          )}
          {filteredProjects.length === 0 ? (
            <div className="empty-inline">
              <strong>{projects.length === 0 ? 'No hay Projects visibles en este workspace ahora.' : 'Sin proyectos coincidentes'}</strong>
              <p>{projects.length === 0
                ? 'La lista puede depender de verificaciones de acceso en GitHub. Puedes volver a intentar cargarla.'
                : 'Ajusta el texto de búsqueda.'}</p>
              {projects.length === 0 && canCreateProject && <button type="button" className="button primary" onClick={() => setShowConnectPanel(true)}>Conectar repositorio</button>}
              {projects.length === 0 && !canCreateProject && <p>Solo un owner activo puede crear Projects en esta organización.</p>}
            </div>
          ) : (
            <div className="project-grid">
              {filteredProjects.map((project) => (
                <ProjectOverviewCard
                  key={project.id}
                  project={project}
                  runsForProject={runsResolved ? runsByProject.get(project.id) ?? [] : null}
                  actionRequiredCount={actionRequiredResolved ? actionRequiredByProject.get(project.id) ?? 0 : null}
                  runsLoading={runsAggregateLoading}
                />
              ))}
            </div>
          )}
          {projectsQuery.hasNextPage && (
            <div className="run-actions">
              <button className="button secondary" type="button" disabled={projectsQuery.isFetchingNextPage} onClick={() => void projectsQuery.fetchNextPage()}>
                {projectsQuery.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      )}

      {workspaceProjectsResolved && runsQuery.isError && <ErrorState message={bindingErrorMessage(runsQuery.error)} correlationId={errorCorrelationId(runsQuery.error)} onRetry={() => void runsQuery.refetch()} />}
      {runsResolved && (
        <div className="panel">
          <div className="section-heading">
            <div><h2>Actividad reciente</h2></div>
            <Link className="card-link" to={`/analysis-runs?workspaceId=${encodeURIComponent(workspace?.id ?? '')}`}>Ver todos →</Link>
          </div>
          {runs.length === 0 ? (
            <div className="empty-inline"><strong>Sin actividad todavía</strong><p>Los Analysis Runs de tus PRs aparecerán aquí.</p></div>
          ) : (
            <ul className="analysis-run-list">
              {runs.slice(0, RECENT_ACTIVITY_LIMIT).map((run) => (
                <li key={run.id} className="panel analysis-run-item">
                  <Link to={`/projects/${run.projectId}/runs/${run.id}?workspaceId=${encodeURIComponent(workspace?.id ?? '')}`}>
                    <div className="analysis-run-item-heading">
                      <RepoChip repositoryName={run.pullRequest.repositoryName} />
                      <span className="pr-ref">PR #{run.pullRequest.number}</span>
                      <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
                    </div>
                    <span className="card-link">{formatRelativeAge(run.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mock && workspace && (
        <div className="demo-strip">
          <div>
            <span className="demo-kicker">Demo mode · SDD 2.0</span>
            <strong>Control plane PR-driven</strong>
            <p>Explora escenarios preparados del nuevo flujo: Action Required, Behavioral Mismatch, corrección por nuevo HEAD y publicación de tests.</p>
          </div>
          <Link className="button secondary button-link" to={`/analysis-runs?workspaceId=${encodeURIComponent(workspace?.id ?? '')}`}>Explorar escenarios →</Link>
        </div>
      )}
    </section>
  )
}
