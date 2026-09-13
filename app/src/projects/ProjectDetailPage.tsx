import { Link, useParams } from 'react-router-dom'
import { useRepositoryBinding } from '../control-plane/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { useProject } from './queries'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)

  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const project = projectQuery.data
  const binding = bindingQuery.data
  return (
    <section>
      <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: project.name }]} />
      <div className="page-heading detail-heading"><div><p className="eyebrow">Proyecto</p><h1>{project.name}</h1><p>ID: <code>{project.id}</code></p></div></div>
      <div className="panel">
        <div className="section-heading"><div><h2>Repository binding</h2><p>El control plane PR-driven es el camino principal de este proyecto.</p></div></div>
        {binding ? (
          <>
            <dl className="metadata"><div><dt>Repositorio</dt><dd>{binding.repositoryName}</dd></div><div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div><div><dt>Estado</dt><dd><span className="status-badge status-success">{binding.status}</span></dd></div></dl>
            <div className="detail-actions"><Link className="button secondary button-link" to={`/analysis-runs?projectId=${project.id}`}>Ver Runs de este proyecto →</Link><Link className="button secondary button-link" to={`/projects/${project.id}/integrations/github`}>Gestionar integración →</Link></div>
          </>
        ) : (
          <div className="empty-inline"><strong>Sin repositorio vinculado</strong><p>Conecta una GitHub App para habilitar análisis automático por PR.</p><Link className="button primary button-link" to={`/projects/${project.id}/integrations/github`}>Conectar GitHub →</Link></div>
        )}
      </div>
      {/* El link a "Herramientas legacy" (/projects/:id/legacy, LegacyToolsPage) se ocultó a pedido
          explícito del usuario: la ruta y el código siguen intactos, solo se retiró de la UI principal. */}
    </section>
  )
}
