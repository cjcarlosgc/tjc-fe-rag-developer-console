import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { useFunctionalKnowledge } from './queries'
import { groupByScenarioKind } from './knowledgeScenarios'
import type { FunctionalKnowledgeStatus } from './types'

type StatusFilter = 'ALL' | FunctionalKnowledgeStatus

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUPERSEDED', label: 'Superseded' },
]

/** HU07/HU09 · INTEROP-2.7 §6.11 — reglas de Functional Knowledge agrupadas por escenario; varias ACTIVE pueden compartir target. */
export function FunctionalKnowledgePage() {
  const { projectId = '' } = useParams()
  const mock = isMockDataSource()
  const projectQuery = useProject(projectId)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const knowledgeQuery = useFunctionalKnowledge(projectId, statusFilter === 'ALL' ? undefined : statusFilter)
  const groups = knowledgeQuery.data ? groupByScenarioKind(knowledgeQuery.data.items) : []

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: projectQuery.data ? `/?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : '/' }, { label: projectQuery.data?.name ?? projectId, to: projectQuery.data ? `/projects/${projectId}?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : `/projects/${projectId}` }, { label: 'Functional Knowledge' }]} />
    <ProjectTabs projectId={projectId} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Control plane / human-in-the-loop</p>
        <h1>Functional Knowledge</h1>
        <p>Respuestas humanas convertidas en reglas persistentes y reutilizables — no es solo historial de preguntas.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    <div className="list-toolbar">
      <fieldset className="segmented">
        <legend>Estado</legend>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} key={value}>{label}</button>
        ))}
      </fieldset>
    </div>

    {knowledgeQuery.isPending && <LoadingState label="Cargando reglas…" />}
    {knowledgeQuery.isError && <ErrorState message={knowledgeQuery.error.message} onRetry={() => void knowledgeQuery.refetch()} />}
    <div role={knowledgeQuery.isSuccess ? 'status' : undefined}>
      {knowledgeQuery.data && groups.length === 0 && <div className="empty-inline"><strong>Sin reglas</strong><p>Todavía no hay conocimiento funcional persistido para este filtro.</p></div>}
    </div>
    {knowledgeQuery.data && groups.map((group) => (
          <section className="fk-group" aria-labelledby={`fk-group-${group.key}`} key={group.key}>
            <h2 id={`fk-group-${group.key}`}>{group.label}</h2>
            <p className="fk-group-count">{group.items.length === 1 ? '1 regla' : `${group.items.length} reglas`}</p>
            <ul className="action-required-list">
              {group.items.map((item) => (
                <li key={item.id} className="panel action-required-item">
                  <Link to={`/projects/${projectId}/functional-knowledge/${item.id}${projectQuery.data ? `?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : ''}`}>
                    <div className="action-required-item-heading">
                      <span className="target-ref">{item.targetRef ?? item.scope}</span>
                      <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-success' : 'status-muted'}`}>{item.status}</span>
                    </div>
                    <p>{item.normalizedRule}</p>
                    <p className="fk-card-meta"><span>Clave de escenario </span><code>{item.scenarioKey}</code></p>
                    <span className="card-link">Ver detalle →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
  </section>
}
