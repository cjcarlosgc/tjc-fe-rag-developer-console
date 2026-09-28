import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { bindingErrorMessage, errorCorrelationId, isProjectNotFound } from '../control-plane/errors'
import { useRepositoryBinding } from '../control-plane/queries'
import { BINDING_STATUS_BADGES } from '../control-plane/status'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorNote, ErrorState, LoadingState, ProjectNotFoundState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { useDeleteProject, useProject, usePurgeProjectQueries, useRenameProject } from './queries'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)
  const deleteProject = useDeleteProject()
  const renameProject = useRenameProject()
  const navigate = useNavigate()
  const mock = isMockDataSource()
  const purgeProjectQueries = usePurgeProjectQueries()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [projectName, setProjectName] = useState('')
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
  if (isProjectNotFound(bindingQuery.error)) return <ProjectNotFoundState />
  if (projectQuery.isPending) return <LoadingState label="Cargando proyecto…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (bindingQuery.isPending) return <LoadingState label="Cargando integración…" />
  if (bindingQuery.isError) return <ErrorState message={bindingErrorMessage(bindingQuery.error)} correlationId={errorCorrelationId(bindingQuery.error)} onRetry={() => void bindingQuery.refetch()} />

  const project = projectQuery.data
  const binding = bindingQuery.data ?? null
  const canMaintain = project.role === 'ADMIN' || project.role === 'MAINTAINER'
  function saveProjectName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name || name === project.name) { setEditingName(false); return }
    renameProject.mutate({ projectId: project.id, input: { name } }, { onSuccess: () => setEditingName(false) })
  }
  return (
    <section>
      <Breadcrumbs items={[{ label: 'Proyectos', to: `/?workspaceId=${encodeURIComponent(project.workspace.id)}` }, { label: project.name }]} />
      <ProjectTabs projectId={project.id} />
      <div className="page-heading detail-heading"><div><p className="eyebrow">{project.workspace.login ?? 'Cuenta personal'} · {project.role}</p><h1>{project.name}</h1><p>ID: <code>{project.id}</code></p></div></div>
      {project.role === 'ADMIN' && <div className="panel">
        <div className="section-heading"><div><h2>Nombre del Project</h2><p>Solo los Admin pueden cambiar el nombre; el workspace y el repositorio no se modifican.</p></div></div>
        {editingName ? (
          <form className="create-form" onSubmit={saveProjectName}>
            <div className="field"><label htmlFor="project-rename">Nuevo nombre</label><input id="project-rename" value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={200} required /></div>
            <div className="run-actions">
              <button type="button" className="button secondary" disabled={renameProject.isPending} onClick={() => { renameProject.reset(); setEditingName(false) }}>Cancelar</button>
              <button type="submit" className="button primary" disabled={!projectName.trim() || renameProject.isPending}>{renameProject.isPending ? 'Guardando…' : 'Guardar nombre'}</button>
            </div>
            {renameProject.isError && <ErrorNote message={bindingErrorMessage(renameProject.error)} correlationId={errorCorrelationId(renameProject.error)} />}
          </form>
        ) : <button type="button" className="button secondary" onClick={() => { setProjectName(project.name); setEditingName(true) }}>Renombrar Project</button>}
      </div>}
      <div className="panel">
        <div className="section-heading"><div><h2>Repository binding</h2><p>El control plane PR-driven es el camino principal de este proyecto.</p></div></div>
        {binding ? (
          /* Ver Runs / Functional Knowledge / Gestionar integración ya viven en <ProjectTabs> arriba — no se duplican acá. */
          <dl className="metadata"><div><dt>Repositorio</dt><dd><RepoChip repositoryName={binding.repositoryName} /></dd></div><div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div><div><dt>Estado</dt><dd><span className={`status-badge ${BINDING_STATUS_BADGES[binding.status].className}`}>{BINDING_STATUS_BADGES[binding.status].label}</span></dd></div></dl>
        ) : (
          <div className="empty-inline"><strong>Sin repositorio vinculado</strong><p>Conecta una GitHub App para habilitar análisis automático por PR.</p>{canMaintain ? <Link className="button primary button-link" to={`/projects/${project.id}/integrations/github?workspaceId=${encodeURIComponent(project.workspace.id)}`}>Conectar GitHub →</Link> : <p>Tu rol es de solo lectura; un Maintainer o Admin debe vincular el repositorio.</p>}</div>
        )}
      </div>
      {/* HU56: borrado lógico, `DELETE /projects/{id}` (INTEROP-2.3, implementado en Core — CS-20260920-003). */}
      {project.role === 'ADMIN' && <div className="panel danger-zone">
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
                  navigate(`/?workspaceId=${encodeURIComponent(project.workspace.id)}`, { state: { deletedProjectName: project.name } })
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
      }
      {canMaintain && <div className="detail-actions"><Link className="button secondary button-link" to={`/projects/${project.id}/experimental?workspaceId=${encodeURIComponent(project.workspace.id)}`}>Modo experimental →</Link></div>}
    </section>
  )
}
