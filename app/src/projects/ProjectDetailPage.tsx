import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { bindingErrorMessage, errorCorrelationId, isProjectNotFound } from '../control-plane/errors'
import { useRepositoryBinding } from '../control-plane/queries'
import { BINDING_STATUS_BADGES } from '../control-plane/status'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorNote, ErrorState, LoadingState, ProjectNotFoundState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { useDeleteProject, useProject, usePurgeProjectQueries } from './queries'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)
  const deleteProject = useDeleteProject()
  const navigate = useNavigate()
  const mock = isMockDataSource()
  const purgeProjectQueries = usePurgeProjectQueries()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirmingRef = useRef(false)
  const deletedProjectIdRef = useRef<string | null>(null)

  // Foco: al abrir la confirmación va a «Cancelar» (nunca al botón destructivo); al cancelar vuelve a «Eliminar proyecto».
  useEffect(() => {
    if (confirmingDelete) {
      cancelButtonRef.current?.focus()
      wasConfirmingRef.current = true
    } else if (wasConfirmingRef.current) {
      deleteButtonRef.current?.focus()
      wasConfirmingRef.current = false
    }
  }, [confirmingDelete])

  // Tras borrar, el caché propio del proyecto se limpia recién al desmontar (ya navegamos): quitarlo antes con la página montada provocaría un refetch 404 visible.
  useEffect(() => () => {
    if (deletedProjectIdRef.current) purgeProjectQueries(deletedProjectIdRef.current)
  }, [purgeProjectQueries])

  if (isProjectNotFound(projectQuery.error)) return <ProjectNotFoundState />
  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />

  const project = projectQuery.data
  const binding = bindingQuery.data
  return (
    <section>
      <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: project.name }]} />
      <ProjectTabs projectId={project.id} />
      <div className="page-heading detail-heading"><div><p className="eyebrow">Proyecto</p><h1>{project.name}</h1><p>ID: <code>{project.id}</code></p></div></div>
      <div className="panel">
        <div className="section-heading"><div><h2>Repository binding</h2><p>El control plane PR-driven es el camino principal de este proyecto.</p></div></div>
        {binding ? (
          /* Ver Runs / Functional Knowledge / Gestionar integración ya viven en <ProjectTabs> arriba — no se duplican acá. */
          <dl className="metadata"><div><dt>Repositorio</dt><dd><RepoChip repositoryName={binding.repositoryName} /></dd></div><div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div><div><dt>Estado</dt><dd><span className={`status-badge ${BINDING_STATUS_BADGES[binding.status].className}`}>{BINDING_STATUS_BADGES[binding.status].label}</span></dd></div></dl>
        ) : (
          <div className="empty-inline"><strong>Sin repositorio vinculado</strong><p>Conecta una GitHub App para habilitar análisis automático por PR.</p><Link className="button primary button-link" to={`/projects/${project.id}/integrations/github`}>Conectar GitHub →</Link></div>
        )}
      </div>
      {/* HU56: borrado lógico, `DELETE /projects/{id}` (INTEROP-2.3, implementado en Core — CS-20260920-003). */}
      <div className="panel danger-zone">
        <div className="section-heading">
          <div><h2>Zona de peligro</h2><p>Eliminar el proyecto lo oculta de la plataforma y libera el repositorio vinculado para otro proyecto.</p></div>
          {mock && <span className="demo-stamp">DEMO · ELIMINAR SIMULADO</span>}
        </div>
        {confirmingDelete ? (
          <div role="group" aria-label="Confirmar eliminación del proyecto">
            <p>¿Eliminar <strong>{project.name}</strong>? El proyecto dejará de verse y se liberará el repositorio vinculado; la evidencia no se borra físicamente.</p>
            <div className="run-actions">
              <button ref={cancelButtonRef} type="button" className="button secondary" disabled={deleteProject.isPending} onClick={() => { deleteProject.reset(); setConfirmingDelete(false) }}>Cancelar</button>
              <button type="button" className="button danger" disabled={deleteProject.isPending} onClick={() => deleteProject.mutate(project.id, {
                onSuccess: () => {
                  deletedProjectIdRef.current = project.id
                  navigate('/', { state: { deletedProjectName: project.name } })
                },
              })}>
                {deleteProject.isPending ? 'Eliminando…' : `Eliminar ${project.name}`}
              </button>
            </div>
            {deleteProject.isError && <ErrorNote message={bindingErrorMessage(deleteProject.error)} correlationId={errorCorrelationId(deleteProject.error)} />}
          </div>
        ) : (
          <div className="run-actions">
            <button ref={deleteButtonRef} type="button" className="button danger" onClick={() => setConfirmingDelete(true)}>Eliminar proyecto</button>
          </div>
        )}
      </div>
      {/* HU19 (RAG vs agente generalista) es capacidad de tesis vigente, no ZIP-legacy — vive fuera
          del panel de binding y de "Herramientas legacy" a propósito. */}
      <div className="detail-actions"><Link className="button secondary button-link" to={`/projects/${project.id}/experimental`}>Modo experimental →</Link></div>
      {/* El link a "Herramientas legacy" (/projects/:id/legacy, LegacyToolsPage) se ocultó a pedido
          explícito del usuario: la ruta y el código siguen intactos, solo se retiró de la UI principal. */}
    </section>
  )
}
