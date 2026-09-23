import { Link, useLocation } from 'react-router-dom'
import { useProject } from '../projects/queries'

interface Tab {
  label: string
  to: (projectId: string) => string
  isActive: (pathname: string, search: string, projectId: string) => boolean
}

/** "History" queda fuera a propósito: no hay timeline/historial real de un AnalysisRun en el contrato todavía. */
const TABS: Tab[] = [
  { label: 'Overview', to: (id) => `/projects/${id}`, isActive: (pathname, _search, id) => pathname === `/projects/${id}` },
  { label: 'Runs', to: (id) => `/analysis-runs?projectId=${id}`, isActive: (pathname, search) => pathname === '/analysis-runs' && new URLSearchParams(search).get('projectId') !== null },
  { label: 'Functional Knowledge', to: (id) => `/projects/${id}/functional-knowledge`, isActive: (pathname, _search, id) => pathname.startsWith(`/projects/${id}/functional-knowledge`) },
  { label: 'Integrations', to: (id) => `/projects/${id}/integrations/github`, isActive: (pathname, _search, id) => pathname === `/projects/${id}/integrations/github` },
]

/** Sub-nav persistente por proyecto (Overview/Runs/Functional Knowledge/Integrations). El tab activo se deriva de la ruta actual, no de un prop. */
export function ProjectTabs({ projectId }: { projectId: string }) {
  const location = useLocation()
  const projectQuery = useProject(projectId)
  return (
    <nav className="project-tabs" aria-label="Secciones del proyecto">
      {TABS.map((tab) => {
        const active = tab.isActive(location.pathname, location.search, projectId)
        const basePath = tab.to(projectId)
        const tabPath = projectQuery.data ? `${basePath}${basePath.includes('?') ? '&' : '?'}workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : basePath
        return (
          <Link key={tab.label} to={tabPath} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
