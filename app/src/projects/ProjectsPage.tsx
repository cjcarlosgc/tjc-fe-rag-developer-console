import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { CreateProjectForm } from './CreateProjectForm'
import { useProjects } from './queries'

export function ProjectsPage() {
  const navigate = useNavigate()
  const mock = isMockDataSource()
  const projectsQuery = useProjects()
  const [query, setQuery] = useState('')
  const projects = useMemo(() => projectsQuery.data?.pages.flatMap((page) => page.items) ?? [], [projectsQuery.data])
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(query.trim().toLowerCase())),
    [projects, query],
  )

  return <section><div className="page-heading"><div><p className="eyebrow">Workspace / project index</p><h1>Proyectos</h1><p>Selecciona un escenario preparado o crea un espacio técnico nuevo.</p></div>{mock && <span className="demo-stamp">SCENARIO 01</span>}</div>{mock && <div className="demo-intro"><div><span className="demo-kicker">Demo preparada</span><strong>checkout-service</strong><p>Tres versiones indexadas con inventarios distintos, brechas de cobertura y datos suficientes para recorrer generación y experimento.</p></div><Link className="button primary button-link" to="/projects/prj_checkout_demo">Iniciar recorrido <span aria-hidden="true">→</span></Link></div>}{projectsQuery.isPending && <LoadingState label={mock ? 'Preparando proyectos demo…' : 'Cargando proyectos…'} />}{projectsQuery.isError && <ErrorState message={projectsQuery.error.message} onRetry={() => void projectsQuery.refetch()} />}{projectsQuery.data && <>{projects.length > 4 && <div className="field list-search"><label htmlFor="project-query">Buscar proyecto</label><input id="project-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="nombre del proyecto" /></div>}{filteredProjects.length === 0 ? <div className="empty-inline"><strong>{projects.length === 0 ? 'Todavía no hay proyectos' : 'Sin proyectos coincidentes'}</strong><p>{projects.length === 0 ? 'Crea el primero con el formulario de abajo.' : 'Ajusta el texto de búsqueda.'}</p></div> : <div className="project-grid demo-project-grid">{filteredProjects.map((project, index) => <Link className="project-card" to={`/projects/${project.id}`} key={project.id}><div><span className={`status-dot ${project.currentVersionId ? 'status-ready' : 'status-empty'}`} aria-hidden="true" /><span className="project-icon">{String(index + 1).padStart(2, '0')}</span><h2>{project.name}</h2></div><p>{project.currentVersionId ? `ProjectVersion lista · ${project.currentVersionId}` : 'Sin versión · preparada para demostrar la carga ZIP'}</p><span className="card-link">Abrir proyecto →</span></Link>)}</div>}{projectsQuery.hasNextPage && <div className="run-actions"><button className="button secondary" type="button" disabled={projectsQuery.isFetchingNextPage} onClick={() => void projectsQuery.fetchNextPage()}>{projectsQuery.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}</button></div>}</>}<div className="panel create-panel"><div className="section-heading"><div><h2>Crear proyecto</h2><p>{mock ? 'El proyecto vivirá durante esta sesión de demo.' : 'RAG Core conservará cada versión bajo esta identidad.'}</p></div><span className="step-number">PROJECT</span></div><CreateProjectForm onCreated={(id) => navigate(`/projects/${id}`)} /></div></section>
}
