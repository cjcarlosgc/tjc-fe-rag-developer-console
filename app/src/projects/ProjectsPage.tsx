import { Link, useNavigate } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { CreateProjectForm } from './CreateProjectForm'
import { useProjects } from './queries'

export function ProjectsPage() {
  const navigate = useNavigate()
  const mock = isMockDataSource()
  const projectsQuery = useProjects(mock)

  return <section><div className="page-heading"><div><p className="eyebrow">Workspace / project index</p><h1>Proyectos</h1><p>Selecciona un escenario preparado o crea un espacio técnico nuevo.</p></div>{mock && <span className="demo-stamp">SCENARIO 01</span>}</div>{mock && <div className="demo-intro"><div><span className="demo-kicker">Demo preparada</span><strong>checkout-service</strong><p>Proyecto indexado con inventario, brechas de cobertura y datos suficientes para recorrer generación y experimento.</p></div><Link className="button primary button-link" to="/projects/prj_checkout_demo">Iniciar recorrido <span aria-hidden="true">→</span></Link></div>}{mock && projectsQuery.isPending && <LoadingState label="Preparando proyectos demo…" />}{mock && projectsQuery.isError && <ErrorState message={projectsQuery.error.message} onRetry={() => void projectsQuery.refetch()} />}{mock && projectsQuery.data && <div className="project-grid demo-project-grid">{projectsQuery.data.map((project, index) => <Link className="project-card" to={`/projects/${project.id}`} key={project.id}><div><span className="project-icon">{String(index + 1).padStart(2, '0')}</span><h2>{project.name}</h2></div><p>{project.currentVersionId ? `ProjectVersion lista · ${project.currentVersionId}` : 'Sin versión · preparada para demostrar la carga ZIP'}</p><span className="card-link">Abrir proyecto →</span></Link>)}</div>}<div className="panel create-panel"><div className="section-heading"><div><h2>Crear proyecto</h2><p>{mock ? 'El proyecto vivirá durante esta sesión de demo.' : 'RAG Core conservará cada versión bajo esta identidad.'}</p></div><span className="step-number">PROJECT</span></div><CreateProjectForm onCreated={(id) => navigate(`/projects/${id}`)} /></div>{!mock && <div className="contract-note" role="status"><span className="contract-glyph" aria-hidden="true">API</span><div><strong>Listado todavía no disponible</strong><p>RAG Core aún no publicó el contrato de <code>GET /projects</code>. Puedes crear proyectos y abrir su detalle directamente.</p></div></div>}</section>
}
