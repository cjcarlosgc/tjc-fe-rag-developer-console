import { Link, Outlet } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'

export function AppShell() {
  const mock = isMockDataSource()
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="RAG Developer Console, proyectos">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RAG Developer Console</span>
        </Link>
        <span className={`environment ${mock ? 'environment-demo' : ''}`}><i aria-hidden="true" />{mock ? 'DEMO · DATOS SIMULADOS' : 'LIVE · CORE API'}</span>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  )
}
