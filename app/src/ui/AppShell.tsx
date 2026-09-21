import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, Outlet } from 'react-router-dom'
import { useActionRequiredList } from '../action-required/queries'
import { isMockDataSource } from '../api/dataSource'
import { isMockAuth } from '../auth/authMode'
import { useAuth } from '../auth/useAuth'

export function AppShell() {
  const mockData = isMockDataSource()
  const mockAuth = isMockAuth()
  const { session, signOut, oauthError, dismissOAuthError, sessionNotice, dismissSessionNotice } = useAuth()
  const queryClient = useQueryClient()
  const mainRef = useRef<HTMLElement>(null)
  // El banner desaparece al pulsar sus botones: el foco pasa a `main` para no perderse en <body>.
  function closeIdentityNotice(retry: boolean) {
    dismissSessionNotice()
    if (retry) void queryClient.invalidateQueries()
    mainRef.current?.focus()
  }
  const actionRequiredQuery = useActionRequiredList()
  const actionRequiredCount = actionRequiredQuery.data?.items.length ?? 0
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="RAG Developer Console, proyectos">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RAG Developer Console</span>
        </Link>
        <nav className="topbar-nav" aria-label="Navegación principal">
          <Link to="/analysis-runs">Runs</Link>
          <Link to="/action-required">Action Required{actionRequiredCount > 0 && <span className="nav-badge">{actionRequiredCount}</span>}</Link>
        </nav>
        <div className="topbar-badges">
          <span className={`environment ${mockData ? 'environment-demo' : ''}`}><i aria-hidden="true" />{mockData ? 'DEMO · DATOS SIMULADOS' : 'LIVE · CORE API'}</span>
          {mockAuth && <span className="environment environment-demo"><i aria-hidden="true" />DEMO · IDENTIDAD SIMULADA</span>}
          {session && <div className="user-menu">
            <span className="user-email">{session.user.email}</span>
            <button type="button" className="button secondary" onClick={() => void signOut()}>Cerrar sesión</button>
          </div>}
        </div>
      </header>
      <main className="content" ref={mainRef} tabIndex={-1}>
        {oauthError && <div className="feedback error-state" role="alert">
          <strong>No se pudo conectar GitHub</strong>
          <p>{oauthError}</p>
          <button className="button secondary" type="button" onClick={dismissOAuthError}>Cerrar</button>
        </div>}
        {sessionNotice?.kind === 'identity-unavailable' && <div className="feedback error-state" role="alert">
          <strong>Identidad no disponible</strong>
          <p>{sessionNotice.message}</p>
          <div className="run-actions">
            <button className="button primary" type="button" onClick={() => closeIdentityNotice(true)}>Reintentar</button>
            <button className="button secondary" type="button" onClick={() => closeIdentityNotice(false)}>Cerrar</button>
          </div>
        </div>}
        <Outlet />
      </main>
    </div>
  )
}
