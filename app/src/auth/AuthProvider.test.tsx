import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { AuthProvider } from './AuthProvider'
import { setAuthModeForTests } from './authMode'
import { useAuth } from './useAuth'

function Probe() {
  const { status, session, signIn, linkGitHub, signOut } = useAuth()
  return <div>
    <span data-testid="status">{status}</span>
    <span data-testid="email">{session?.user.email ?? ''}</span>
    <span data-testid="github-token">{session?.githubProviderToken ?? ''}</span>
    <button type="button" onClick={() => void signIn('demo@rag-test-studio.local', 'secret1')}>signin</button>
    <button type="button" onClick={() => void linkGitHub()}>link-github</button>
    <button type="button" onClick={() => void signOut()}>signout</button>
  </div>
}

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

describe('AuthProvider', () => {
  it('inicia unauthenticated sin sesión guardada, y permite iniciar/cerrar sesión', async () => {
    const user = userEvent.setup()
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))

    await user.click(screen.getByText('signin'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('email')).toHaveTextContent('demo@rag-test-studio.local')

    await user.click(screen.getByText('signout'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
  })

  it('restaura la sesión persistida en localStorage', async () => {
    localStorage.setItem('rag-console.mock-session', JSON.stringify({ user: { id: 'user_demo_local', email: 'demo@rag-test-studio.local' }, accessToken: 'mock-session-token' }))
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  })

  it('HU30: linkGitHub agrega el provider token a la sesión de correo activa', async () => {
    const user = userEvent.setup()
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    await user.click(screen.getByText('signin'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('github-token')).toHaveTextContent('')

    await user.click(screen.getByText('link-github'))
    await waitFor(() => expect(screen.getByTestId('github-token')).toHaveTextContent('mock-github-provider-token'))
    expect(screen.getByTestId('email')).toHaveTextContent('demo@rag-test-studio.local')
  })

  it('bloquea VITE_AUTH_MODE=mock junto a datos live, sin formulario alcanzable', () => {
    setDataSourceForTests('live')
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent(/Combinación de entorno no permitida/)
    expect(screen.queryByTestId('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
