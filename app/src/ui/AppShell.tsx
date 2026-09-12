import { Link, Outlet } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { isMockAuth } from '../auth/authMode'
import { useAuth } from '../auth/useAuth'

export function AppShell() {
  const mockData = isMockDataSource()
  const mockAuth = isMockAuth()
  const { session, signOut } = useAuth()
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="RAG Developer Console, proyectos">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RAG Developer Console</span>
        </Link>
        <div className="topbar-badges">
          <span className={`environment ${mockData ? 'environment-demo' : ''}`}><i aria-hidden="true" />{mockData ? 'DEMO · DATOS SIMULADOS' : 'LIVE · CORE API'}</span>
          {mockAuth && <span className="environment environment-demo"><i aria-hidden="true" />DEMO · IDENTIDAD SIMULADA</span>}
          {session && <div className="user-menu">
            <span className="user-email">{session.user.email}</span>
            <button type="button" className="button secondary" onClick={() => void signOut()}>Cerrar sesión</button>
          </div>}
        </div>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  )
}
