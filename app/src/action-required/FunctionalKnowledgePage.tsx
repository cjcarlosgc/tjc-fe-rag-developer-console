import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { useFunctionalKnowledge } from './queries'
import type { FunctionalKnowledgeStatus } from './types'

type StatusFilter = 'ALL' | FunctionalKnowledgeStatus

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUPERSEDED', label: 'Superseded' },
]

/** HU35/HU36 — reglas de conocimiento funcional persistidas para un Project: qué respondieron los humanos y cómo se reutiliza. */
export function FunctionalKnowledgePage() {
  const { projectId = '' } = useParams()
  const mock = isMockDataSource()
  const projectQuery = useProject(projectId)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const knowledgeQuery = useFunctionalKnowledge(projectId, statusFilter === 'ALL' ? undefined : statusFilter)

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: 'Functional Knowledge' }]} />
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
    {knowledgeQuery.data && (knowledgeQuery.data.items.length === 0
      ? <div className="empty-inline"><strong>Sin reglas</strong><p>Todavía no hay conocimiento funcional persistido para este filtro.</p></div>
      : <ul className="action-required-list">
          {knowledgeQuery.data.items.map((item) => (
            <li key={item.id} className="panel action-required-item">
              <Link to={`/projects/${projectId}/functional-knowledge/${item.id}`}>
                <div className="action-required-item-heading">
                  <span className="target-ref">{item.targetRef ?? item.scope}</span>
                  <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-success' : 'status-muted'}`}>{item.status}</span>
                </div>
                <p>{item.normalizedRule}</p>
                <span className="card-link">Ver detalle →</span>
              </Link>
            </li>
          ))}
        </ul>)}
  </section>
}
