import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
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
    await user.type(screen.getByLabelText('Correo'), 'demo@rag-test-studio.local')
    await user.type(screen.getByLabelText('Contraseña'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
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
})
