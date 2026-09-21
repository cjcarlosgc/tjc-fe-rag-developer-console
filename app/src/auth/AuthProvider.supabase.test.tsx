import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyAuthError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { AuthProvider } from './AuthProvider'
import { setAuthModeForTests } from './authMode'
import { useAuth } from './useAuth'

const getSession = vi.fn()
const signOut = vi.fn()
const signInWithOAuth = vi.fn()
const onAuthStateChange = vi.fn()
const resetSocket = vi.fn()
const renewSocketAuth = vi.fn()

vi.mock('../api/socket', () => ({ resetSocket: () => resetSocket(), renewSocketAuth: () => renewSocketAuth() }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getSession, signOut, signInWithOAuth, onAuthStateChange } }),
}))

function Probe() {
  const { status, sessionNotice, signOut } = useAuth()
  return <div>
    <span data-testid="status">{status}</span>
    <span data-testid="notice-kind">{sessionNotice?.kind ?? ''}</span>
    <button type="button" onClick={() => void signOut()}>signout</button>
  </div>
}

beforeEach(() => {
  setAuthModeForTests('supabase')
  setDataSourceForTests('live')
  getSession.mockReset()
  getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-abc', user: { id: 'u1', email: 'dev@example.com' } } } })
  signOut.mockReset()
  signOut.mockResolvedValue({ error: null })
  resetSocket.mockReset()
  renewSocketAuth.mockReset()
  signInWithOAuth.mockReset()
  onAuthStateChange.mockReset()
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } })
})

afterEach(() => {
  setAuthModeForTests(null)
  setDataSourceForTests(null)
})

async function renderAuthenticated() {
  renderApp(<AuthProvider><Probe /></AuthProvider>)
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
}

describe('AuthProvider con Supabase (HU62, INTEROP-2.4 §6.13)', () => {
  it.each([
    ['AUTH_REQUIRED', 'expired'],
    ['INVALID_ACCESS_TOKEN', 'expired'],
    ['GITHUB_IDENTITY_REQUIRED', 'identity-required'],
  ])('401 %s cierra la sesión y hace signOut de Supabase (%s)', async (code, kind) => {
    await renderAuthenticated()
    act(() => notifyAuthError({ status: 401, code }))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(screen.getByTestId('notice-kind')).toHaveTextContent(kind)
    // Core rechazó esta sesión: cierre `local`, sin revocar las demás sesiones del usuario.
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(resetSocket).toHaveBeenCalled()
    // GITHUB_IDENTITY_REQUIRED no reinicia OAuth por su cuenta (sin bucle).
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })

  it.each(['GITHUB_ACCOUNT_REQUIRED', 'GITHUB_USER_TOKEN_INVALID'])('401 %s no cierra la sesión ni llama a signOut', async (code) => {
    await renderAuthenticated()
    act(() => notifyAuthError({ status: 401, code }))
    await act(async () => { await Promise.resolve() })
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(signOut).not.toHaveBeenCalled()
  })

  it('el cierre manual es global y, si Supabase devuelve error, la UI igualmente queda sin sesión (sin rechazo sin manejar)', async () => {
    const user = userEvent.setup()
    signOut.mockResolvedValue({ error: { message: 'network down' } })
    await renderAuthenticated()
    await user.click(screen.getByText('signout'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(resetSocket).toHaveBeenCalled()
  })

  it('un signOut fallido en el 401 no deja la UI autenticada ni lanza', async () => {
    signOut.mockResolvedValue({ error: { message: 'network down' } })
    await renderAuthenticated()
    act(() => notifyAuthError({ status: 401, code: 'AUTH_REQUIRED' }))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('notice-kind')).toHaveTextContent('expired')
  })

  describe('WebSocket ligado a la sesión (HU62)', () => {
    const sessionOf = (id: string, token: string) => ({ access_token: token, user: { id, email: `${id}@example.com` } })
    const emit = (session: unknown) => act(() => (onAuthStateChange.mock.calls[0][0] as (event: string, session: unknown) => void)('TOKEN_REFRESHED', session))

    it('token renovado del mismo usuario reconecta el socket con el token vigente, sin descartarlo', async () => {
      await renderAuthenticated()
      resetSocket.mockClear()
      emit(sessionOf('u1', 'jwt-renovado'))
      expect(renewSocketAuth).toHaveBeenCalledTimes(1)
      expect(resetSocket).not.toHaveBeenCalled()
      // Mismo token otra vez: nada que hacer.
      emit(sessionOf('u1', 'jwt-renovado'))
      expect(renewSocketAuth).toHaveBeenCalledTimes(1)
    })

    it('logout y otro usuario descartan el socket: la conexión de A no se reutiliza para B', async () => {
      await renderAuthenticated()
      resetSocket.mockClear()
      emit(null)
      await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
      expect(resetSocket).toHaveBeenCalledTimes(1)
      emit(sessionOf('u2', 'jwt-b'))
      expect(resetSocket).toHaveBeenCalledTimes(2)
      expect(renewSocketAuth).not.toHaveBeenCalled()
    })

    it('cambio directo de usuario A → B (sin pasar por logout) también descarta el socket', async () => {
      await renderAuthenticated()
      resetSocket.mockClear()
      emit(sessionOf('u2', 'jwt-b'))
      expect(resetSocket).toHaveBeenCalledTimes(1)
    })
  })

  it('503 IDENTITY_UNAVAILABLE no cierra la sesión ni llama a signOut', async () => {
    await renderAuthenticated()
    act(() => notifyAuthError({ status: 503, code: 'IDENTITY_UNAVAILABLE' }))
    await waitFor(() => expect(screen.getByTestId('notice-kind')).toHaveTextContent('identity-unavailable'))
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(signOut).not.toHaveBeenCalled()
  })
})
