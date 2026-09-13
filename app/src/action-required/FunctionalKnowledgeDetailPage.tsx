import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { useFunctionalKnowledge } from './queries'

/** HU35/HU36 — detalle de una regla de Functional Knowledge, con trazabilidad de supersesión. */
export function FunctionalKnowledgeDetailPage() {
  const { projectId = '', knowledgeId = '' } = useParams()
  const mock = isMockDataSource()
  const projectQuery = useProject(projectId)
  const knowledgeQuery = useFunctionalKnowledge(projectId)

  if (knowledgeQuery.isPending) return <LoadingState label="Cargando regla…" />
  if (knowledgeQuery.isError) return <ErrorState message={knowledgeQuery.error.message} onRetry={() => void knowledgeQuery.refetch()} />

  const item = knowledgeQuery.data.items.find((entry) => entry.id === knowledgeId)
  if (!item) return <div className="empty-inline"><strong>Regla no encontrada</strong><p>No existe esta regla de Functional Knowledge en este proyecto.</p></div>

  const supersedes = item.supersedesId ? knowledgeQuery.data.items.find((entry) => entry.id === item.supersedesId) : undefined
  const supersededBy = knowledgeQuery.data.items.find((entry) => entry.supersedesId === item.id)

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: 'Functional Knowledge', to: `/projects/${projectId}/functional-knowledge` }, { label: item.targetRef ?? item.scope }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Functional Knowledge</p>
        <h1>{item.normalizedRule}</h1>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    <div className="panel analysis-run-summary">
      <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-success' : 'status-muted'}`}>{item.status}</span>
      <dl className="metadata">
        <div><dt>Scope</dt><dd>{item.scope}</dd></div>
        <div><dt>Target</dt><dd><code>{item.targetRef ?? '—'}</code></dd></div>
        <div><dt>Fuente</dt><dd>{item.source === 'HUMAN_ANSWER' ? 'Respuesta humana' : 'Importación aprobada'}</dd></div>
        <div><dt>Creado</dt><dd>{new Date(item.createdAt).toLocaleString('es-PE')}</dd></div>
      </dl>
    </div>

    <div className="panel">
      <div className="section-heading"><div><h2>Pregunta y respuesta originales</h2></div></div>
      <p><strong>Pregunta:</strong> {item.originalQuestion}</p>
      <p><strong>Respuesta:</strong> {item.originalAnswer}</p>
    </div>

    {supersedes && (
      <div className="panel contract-note">
        <div><strong>Reemplaza a una regla anterior</strong><p>{supersedes.normalizedRule}</p><Link to={`/projects/${projectId}/functional-knowledge/${supersedes.id}`}>Ver regla reemplazada →</Link></div>
      </div>
    )}
    {supersededBy && (
      <div className="panel contract-note">
        <div><strong>Reemplazada por</strong><p>{supersededBy.normalizedRule}</p><Link to={`/projects/${projectId}/functional-knowledge/${supersededBy.id}`}>Ver regla vigente →</Link></div>
      </div>
    )}
  </section>
}
