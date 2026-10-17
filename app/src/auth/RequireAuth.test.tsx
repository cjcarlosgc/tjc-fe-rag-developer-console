import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { notifyAuthError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { AuthProvider } from './AuthProvider'
import { setAuthModeForTests } from './authMode'
import { LoginPage } from './LoginPage'
import { RequireAuth } from './RequireAuth'

function Protected() {
  return <div>Contenido protegido</div>
}

/** Solo para inspeccionar qué `?returnTo=` construyó `RequireAuth` al redirigir. */
function LoginPageReturnToProbe() {
  const [searchParams] = useSearchParams()
  return <div>returnTo={searchParams.get('returnTo')}</div>
}

function renderRouter(initialEntry: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/secreto" element={<Protected />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

describe('RequireAuth', () => {
  it('redirige a /login cuando no hay sesión', async () => {
    renderRouter('/secreto')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('tras iniciar sesión, vuelve a la ruta original (retorno seguro)', async () => {
    const user = userEvent.setup()
    renderRouter('/secreto')
    await screen.findByRole('heading', { name: 'Iniciar sesión' })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument()
  })

  it('HU38: al redirigir codifica la ruta de origen en "?returnTo=" (sobrevive una recarga completa)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/action-required/arun_checkout_pr42']}>
            <Routes>
              <Route path="/login" element={<LoginPageReturnToProbe />} />
              <Route element={<RequireAuth />}>
                <Route path="/action-required/:analysisRunId" element={<Protected />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('returnTo=/action-required/arun_checkout_pr42')).toBeInTheDocument()
  })

  describe('HU62: sesión cerrada por Core', () => {
    const seedSession = () => localStorage.setItem('rag-console.mock-session', JSON.stringify({ user: { id: 'user_demo_github', email: 'demo@rag-test-studio.local' }, accessToken: 'mock-github-session-token', githubProviderToken: null }))

    it('401 GITHUB_IDENTITY_REQUIRED lleva a /login con un aviso error-state terminal, con foco, sin jerga y sin redirigir a GitHub; el CTA sigue activo', async () => {
      seedSession()
      renderRouter('/secreto')
      await screen.findByText('Contenido protegido')
      act(() => notifyAuthError({ status: 401, code: 'GITHUB_IDENTITY_REQUIRED' }))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveClass('feedback', 'error-state')
      expect(alert).toHaveAttribute('tabindex', '-1')
      expect(alert).toHaveFocus()
      expect(alert).toHaveTextContent('Tu cuenta anterior de acceso por correo ya no se usa. Entra con GitHub.')
      expect(alert).toHaveTextContent('pide ayuda al equipo que administra la plataforma')
      expect(alert).not.toHaveTextContent(/identidad|verificada|sub\b|token/i)
      expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeEnabled()
      // Sin bucle: sigue en /login, sin sesión, sin iniciar el login por su cuenta.
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
      expect(localStorage.getItem('rag-console.mock-session')).toBeNull()
    })

    it('401 AUTH_REQUIRED lleva a /login con el aviso visible «Tu sesión expiró»', async () => {
      seedSession()
      renderRouter('/secreto')
      await screen.findByText('Contenido protegido')
      act(() => notifyAuthError({ status: 401, code: 'AUTH_REQUIRED' }))

      const notice = await screen.findByRole('status')
      expect(notice).toHaveClass('feedback')
      expect(notice).toHaveTextContent('Tu sesión expiró')
    })
  })
})
