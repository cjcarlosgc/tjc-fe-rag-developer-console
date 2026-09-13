import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnalysisProgress } from '../analysis/AnalysisProgress'
import { UploadVersion } from '../analysis/UploadVersion'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import type { UploadAccepted } from './types'
import { useProject } from './queries'

/**
 * Herramientas del flujo ZIP legacy (SDD 1.x): carga manual, análisis, inventario,
 * generación y experimento. Reubicado fuera de `ProjectDetailPage` a pedido explícito
 * del usuario — deja de ser la navegación/UX principal de la Console (el control plane
 * PR-driven lo es), pero se conserva intacto como mecanismo técnico de desarrollo y
 * para el experimento de tesis (HU19), que todavía depende de un target de inventario.
 */
export function LegacyToolsPage() {
  const { projectId = '' } = useParams()
  const [accepted, setAccepted] = useState<UploadAccepted | null>(null)
  const projectQuery = useProject(projectId)

  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const project = projectQuery.data
  return (
    <section>
      <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: project.name, to: `/projects/${project.id}` }, { label: 'Herramientas legacy' }]} />
      <div className="page-heading detail-heading">
        <div><p className="eyebrow">Legacy · SDD 1.x</p><h1>Herramientas ZIP de {project.name}</h1><p>Carga manual, análisis, inventario, generación y experimento — mecanismo de desarrollo, no el flujo de producto principal.</p></div>
        <span className="demo-stamp">LEGACY · DESARROLLO</span>
      </div>
      <div className="panel">
        <div className="section-heading"><div><h2>Versión actual</h2><p>El proyecto y sus versiones conservan identidades separadas.</p></div></div>
        {project.currentVersionId ? (
          <dl className="metadata"><div><dt>ProjectVersion actual</dt><dd><code>{project.currentVersionId}</code></dd></div><div><dt>Estado</dt><dd><span className="status-badge">VINCULADA</span></dd></div><div><dt>Actualizado</dt><dd>{new Date(project.updatedAt).toLocaleDateString('es-PE')}</dd></div></dl>
        ) : (
          <div className="empty-inline"><strong>Sin versiones cargadas</strong><p>Carga un ZIP para crear e indexar la primera ProjectVersion.</p></div>
        )}
      </div>
      <div className="detail-actions"><Link className="button secondary button-link" to={`/projects/${project.id}/experimental`}>Modo experimental</Link><Link className="button secondary button-link" to={`/projects/${project.id}/analyses`}>Historial de análisis <span aria-hidden="true">→</span></Link><Link className="button secondary button-link" to={`/projects/${project.id}/runs`}>Historial de generaciones <span aria-hidden="true">→</span></Link><Link className="button primary button-link" to={`/projects/${project.id}/generate`}>Configurar generación <span aria-hidden="true">→</span></Link></div>
      <div className="flow-connector" aria-hidden="true"><span>01</span><i /></div>
      <div className="panel upload-panel">
        <div className="section-heading"><div><p className="eyebrow">Nueva ProjectVersion</p><h2>Cargar código fuente</h2><p>Cada ZIP crea una versión nueva sin reemplazar el historial anterior.</p></div><span className="step-number">UPLOAD</span></div>
        <UploadVersion projectId={project.id} onAccepted={setAccepted} />
      </div>
      {accepted && <><div className="flow-connector" aria-hidden="true"><span>02</span><i /></div><AnalysisProgress projectVersionId={accepted.projectVersionId} initialPollAfterMs={accepted.pollAfterMs} /></>}
    </section>
  )
}
