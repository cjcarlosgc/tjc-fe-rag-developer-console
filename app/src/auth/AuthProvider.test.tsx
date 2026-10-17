import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyAuthError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { AuthProvider } from './AuthProvider'
import { setAuthModeForTests } from './authMode'
import { useAuth } from './useAuth'

function Probe() {
  const { status, session, signInWithGitHub, signOut, sessionNotice } = useAuth()
  return <div>
    <span data-testid="status">{status}</span>
    <span data-testid="email">{session?.user.email ?? ''}</span>
    <span data-testid="github-token">{session?.githubProviderToken ?? ''}</span>
    <span data-testid="notice-kind">{sessionNotice?.kind ?? ''}</span>
    <span data-testid="notice-message">{sessionNotice?.message ?? ''}</span>
    <button type="button" onClick={() => void signInWithGitHub()}>signin-github</button>
    <button type="button" onClick={() => void signOut()}>signout</button>
  </div>
}

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

afterEach(() => vi.restoreAllMocks())

async function renderAuthenticated() {
  const user = userEvent.setup()
  renderApp(<AuthProvider><Probe /></AuthProvider>)
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
  await user.click(screen.getByText('signin-github'))
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  return user
}

describe('AuthProvider', () => {
  it('inicia unauthenticated sin sesión guardada, y permite iniciar (GitHub demo) y cerrar sesión', async () => {
    const user = await renderAuthenticated()
    expect(screen.getByTestId('email')).toHaveTextContent('demo@rag-test-studio.local')
    expect(screen.getByTestId('github-token')).toHaveTextContent('mock-github-provider-token')

    await user.click(screen.getByText('signout'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
  })

  it('restaura la sesión persistida en localStorage', async () => {
    localStorage.setItem('rag-console.mock-session', JSON.stringify({ user: { id: 'user_demo_github', email: 'demo@rag-test-studio.local' }, accessToken: 'mock-github-session-token' }))
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  })

  it('bloquea VITE_AUTH_MODE=mock junto a datos live, sin formulario alcanzable', () => {
    setDataSourceForTests('live')
    renderApp(<AuthProvider><Probe /></AuthProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent(/Combinación de entorno no permitida/)
    expect(screen.queryByTestId('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  describe('HU62: errores de identidad de Core (INTEROP-2.4 §6.13)', () => {
    it('401 AUTH_REQUIRED cierra la sesión, hace signOut y avisa que la sesión expiró', async () => {
      await renderAuthenticated()
      act(() => notifyAuthError({ status: 401, code: 'AUTH_REQUIRED' }))
      await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
      expect(screen.getByTestId('notice-kind')).toHaveTextContent('expired')
      expect(screen.getByTestId('notice-message')).toHaveTextContent('Tu sesión expiró')
      // En mock el signOut del adapter limpia el almacenamiento demo; el de Supabase se verifica en AuthProvider.supabase.test.tsx.
      await waitFor(() => expect(localStorage.getItem('rag-console.mock-session')).toBeNull())
    })

    it('401 INVALID_ACCESS_TOKEN sin código conocido también expira la sesión', async () => {
      await renderAuthenticated()
      act(() => notifyAuthError({ status: 401 }))
      await waitFor(() => expect(screen.getByTestId('notice-kind')).toHaveTextContent('expired'))
    })

    it('401 GITHUB_IDENTITY_REQUIRED cierra la sesión con mensaje terminal y persistente, sin volver a autenticar por su cuenta', async () => {
      await renderAuthenticated()
      const writes = vi.spyOn(Storage.prototype, 'setItem')
      act(() => notifyAuthError({ status: 401, code: 'GITHUB_IDENTITY_REQUIRED' }))
      await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
      expect(screen.getByTestId('notice-kind')).toHaveTextContent('identity-required')
      expect(screen.getByTestId('notice-message')).toHaveTextContent('Tu cuenta anterior de acceso por correo ya no se usa')
      await waitFor(() => expect(localStorage.getItem('rag-console.mock-session')).toBeNull())
      // Sin bucle: nadie reinició sesión (ni escribió una sesión nueva) tras el rechazo.
      expect(writes).not.toHaveBeenCalled()
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })

    it('varios 401 simultáneos cierran la sesión una sola vez', async () => {
      await renderAuthenticated()
      act(() => {
        notifyAuthError({ status: 401, code: 'GITHUB_IDENTITY_REQUIRED' })
        notifyAuthError({ status: 401, code: 'AUTH_REQUIRED' })
      })
      await waitFor(() => expect(screen.getByTestId('notice-kind')).toHaveTextContent('identity-required'))
    })

    it.each(['GITHUB_ACCOUNT_REQUIRED', 'GITHUB_USER_TOKEN_INVALID', 'CODIGO_DESCONOCIDO'])('401 %s (token OAuth de GitHub, no la sesión) NO cierra la sesión', async (code) => {
      await renderAuthenticated()
      act(() => notifyAuthError({ status: 401, code }))
      await act(async () => { await Promise.resolve() })
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('notice-kind')).toHaveTextContent('')
      expect(localStorage.getItem('rag-console.mock-session')).not.toBeNull()
    })

    it('503 IDENTITY_UNAVAILABLE NO cierra la sesión y deja un aviso reintentable', async () => {
      await renderAuthenticated()
      act(() => notifyAuthError({ status: 503, code: 'IDENTITY_UNAVAILABLE' }))
      await waitFor(() => expect(screen.getByTestId('notice-kind')).toHaveTextContent('identity-unavailable'))
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('notice-message')).toHaveTextContent('Tu sesión sigue activa')
      expect(localStorage.getItem('rag-console.mock-session')).not.toBeNull()
    })
  })
})
