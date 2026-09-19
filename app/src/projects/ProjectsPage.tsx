import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useActionRequiredList } from '../action-required/queries'
import type { FunctionalQuestionResponse } from '../action-required/types'
import { isMockDataSource } from '../api/dataSource'
import { useAnalysisRuns, useRepositoryBinding } from '../control-plane/queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from '../control-plane/status'
import type { AnalysisRunSummaryResponse } from '../control-plane/types'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { formatRelativeAge } from '../ui/relativeTime'
import { CreateProjectForm } from './CreateProjectForm'
import { useProjects } from './queries'
import type { Project } from './types'
import { countActivePullRequests, countRunsCreatedSince, latestRunByProject } from './workspaceOverview'

const RECENT_ACTIVITY_LIMIT = 6
const ACTION_REQUIRED_PREVIEW_LIMIT = 3
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const EMPTY_RUNS: AnalysisRunSummaryResponse[] = []
const EMPTY_ACTION_REQUIRED: FunctionalQuestionResponse[] = []

function ConnectRepositoryPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="panel create-panel">
      <div className="section-heading">
        <div>
          <h2>Conectar repositorio</h2>
          <p>Nombra el Project; después configuras la GitHub App y el binding con el repositorio.</p>
        </div>
        <button type="button" className="button secondary" onClick={onClose}>Cerrar</button>
      </div>
      <CreateProjectForm onCreated={(id) => navigate(`/projects/${id}/integrations/github`)} />
    </div>
  )
}

function ActionRequiredPreview({ items }: { items: FunctionalQuestionResponse[] }) {
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <h2>Requieren tu atención</h2>
          <p>Runs esperando una respuesta funcional antes de continuar el análisis.</p>
        </div>
        <Link className="card-link" to="/action-required">Ver todos →</Link>
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
              <Link to={`/action-required/${question.analysisRunId}?returnTo=${encodeURIComponent('/')}`}>
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
  runsForProject: AnalysisRunSummaryResponse[]
  actionRequiredCount: number
}

export function ProjectOverviewCard({ project, runsForProject, actionRequiredCount }: ProjectOverviewCardProps) {
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

  if (!binding) {
    return (
      <Link className="project-card" to={`/projects/${project.id}/integrations/github`}>
        <div>
          <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
          <h2>{project.name}</h2>
          <span className="status-badge status-muted">NOT CONNECTED</span>
        </div>
        <p>Todavía no hay un repositorio GitHub vinculado a este Project. Conecta un repositorio para analizar automáticamente los Pull Requests dirigidos a la rama de integración.</p>
        <span className="card-link">Configurar GitHub →</span>
      </Link>
    )
  }

  if (binding.status !== 'ENABLED') {
    return (
      <Link className="project-card" to={`/projects/${project.id}/integrations/github`}>
        <div>
          <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
          <h2>{project.name}</h2>
          <span className="status-badge status-warn">DISCONNECTED</span>
        </div>
        <p>El vínculo con GitHub está deshabilitado. No se procesarán nuevos Pull Requests.</p>
        <span className="card-link">Revisar integración →</span>
      </Link>
    )
  }

  const activePrs = countActivePullRequests(runsForProject)
  const latestRun = latestRunByProject(runsForProject).get(project.id)

  return (
    <Link className="project-card" to={`/projects/${project.id}`}>
      <div>
        <span className="project-icon">{project.name.slice(0, 2).toUpperCase()}</span>
        <h2>{project.name}</h2>
        <span className="status-badge status-success">CONNECTED</span>
      </div>
      <p><RepoChip repositoryName={binding.repositoryName} /></p>
      <p>Integration branch <code>{binding.integrationBranch}</code></p>
      <dl className="project-stats">
        <div><dt>Active PRs</dt><dd>{activePrs}</dd></div>
        <div><dt>Action Required</dt><dd>{actionRequiredCount}</dd></div>
      </dl>
      {latestRun ? (
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
  const projectsQuery = useProjects()
  const runsQuery = useAnalysisRuns()
  const actionRequiredQuery = useActionRequiredList()
  const [query, setQuery] = useState('')
  const [showConnectPanel, setShowConnectPanel] = useState(false)
  const [now] = useState(() => Date.now())

  const projects = useMemo(() => projectsQuery.data?.pages.flatMap((page) => page.items) ?? [], [projectsQuery.data])
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(query.trim().toLowerCase())),
    [projects, query],
  )
  const runs = runsQuery.data?.items ?? EMPTY_RUNS
  const actionRequiredItems = actionRequiredQuery.data?.items ?? EMPTY_ACTION_REQUIRED
  const runsResolved = Boolean(runsQuery.data)
  const actionRequiredResolved = Boolean(actionRequiredQuery.data)

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

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace / Overview</p>
          <h1>Proyectos</h1>
          <p>Supervisa tus repositorios conectados, Pull Requests y análisis que requieren atención.</p>
        </div>
        <button type="button" className="button primary" onClick={() => setShowConnectPanel((value) => !value)}>+ Conectar repositorio</button>
      </div>

      {showConnectPanel && <ConnectRepositoryPanel onClose={() => setShowConnectPanel(false)} />}

      <div className="kpi-grid">
        <div className="kpi-card"><strong>{projects.length}</strong><span>Proyectos</span></div>
        <div className="kpi-card"><strong>{activePrCount ?? '—'}</strong><span>PR activos</span></div>
        <div className={`kpi-card${(actionRequiredCount ?? 0) > 0 ? ' kpi-card-alert' : ''}`}><strong>{actionRequiredCount ?? '—'}</strong><span>Action Required</span></div>
        <div className="kpi-card"><strong>{runsThisWeek ?? '—'}</strong><span>Runs esta semana</span></div>
      </div>

      {actionRequiredResolved && <ActionRequiredPreview items={actionRequiredItems} />}

      {projectsQuery.isPending && <LoadingState label={mock ? 'Preparando proyectos demo…' : 'Cargando proyectos…'} />}
      {projectsQuery.isError && <ErrorState message={projectsQuery.error.message} onRetry={() => void projectsQuery.refetch()} />}
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
              <strong>{projects.length === 0 ? 'Aún no tienes repositorios conectados.' : 'Sin proyectos coincidentes'}</strong>
              <p>{projects.length === 0
                ? 'Conecta un repositorio GitHub para comenzar a analizar automáticamente Pull Requests.'
                : 'Ajusta el texto de búsqueda.'}</p>
              {projects.length === 0 && <button type="button" className="button primary" onClick={() => setShowConnectPanel(true)}>Conectar repositorio</button>}
            </div>
          ) : (
            <div className="project-grid">
              {filteredProjects.map((project) => (
                <ProjectOverviewCard
                  key={project.id}
                  project={project}
                  runsForProject={runsByProject.get(project.id) ?? []}
                  actionRequiredCount={actionRequiredByProject.get(project.id) ?? 0}
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

      {runsResolved && (
        <div className="panel">
          <div className="section-heading">
            <div><h2>Actividad reciente</h2></div>
            <Link className="card-link" to="/analysis-runs">Ver todos →</Link>
          </div>
          {runs.length === 0 ? (
            <div className="empty-inline"><strong>Sin actividad todavía</strong><p>Los Analysis Runs de tus PRs aparecerán aquí.</p></div>
          ) : (
            <ul className="analysis-run-list">
              {runs.slice(0, RECENT_ACTIVITY_LIMIT).map((run) => (
                <li key={run.id} className="panel analysis-run-item">
                  <Link to={`/projects/${run.projectId}/runs/${run.id}`}>
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

      {mock && (
        <div className="demo-strip">
          <div>
            <span className="demo-kicker">Demo mode · SDD 2.0</span>
            <strong>Control plane PR-driven</strong>
            <p>Explora escenarios preparados del nuevo flujo: Action Required, Behavioral Mismatch, corrección por nuevo HEAD y publicación de tests.</p>
          </div>
          <Link className="button secondary button-link" to="/analysis-runs">Explorar escenarios →</Link>
        </div>
      )}
    </section>
  )
}
