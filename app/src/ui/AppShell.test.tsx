import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { notifyAuthError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { setAuthModeForTests } from '../auth/authMode'
import { AppShell } from './AppShell'

function Home() {
  return <div>Inicio</div>
}

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes><Route path="/" element={<AppShell />}><Route index element={<Home />} /></Route></Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

const storedSession = JSON.stringify({ user: { id: 'user_demo_local', email: 'demo@rag-test-studio.local' }, accessToken: 'mock-session-token' })

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('AppShell', () => {
  it('muestra la píldora de identidad simulada y el correo de sesión, como indicador independiente del de datos', async () => {
    localStorage.setItem('rag-console.mock-session', storedSession)
    renderShell()
    expect(await screen.findByText('DEMO · IDENTIDAD SIMULADA')).toBeInTheDocument()
    expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
    expect(screen.getByText('demo@rag-test-studio.local')).toBeInTheDocument()
  })

  it('"Cerrar sesión" limpia la sesión mostrada', async () => {
    localStorage.setItem('rag-console.mock-session', storedSession)
    const user = userEvent.setup()
    renderShell()
    await screen.findByText('demo@rag-test-studio.local')
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(screen.queryByText('demo@rag-test-studio.local')).not.toBeInTheDocument())
  })

  it('el link "Action Required" muestra un badge con el conteo de Runs pendientes', async () => {
    renderShell()
    const badge = await screen.findByText('5', { selector: '.nav-badge' })
    expect(badge.closest('a')).toHaveTextContent('Action Required')
  })

  it('HU62: 503 IDENTITY_UNAVAILABLE muestra un aviso reintentable sin cerrar la sesión', async () => {
    localStorage.setItem('rag-console.mock-session', storedSession)
    const user = userEvent.setup()
    renderShell()
    await screen.findByText('demo@rag-test-studio.local')
    act(() => notifyAuthError({ status: 503, code: 'IDENTITY_UNAVAILABLE' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Tu sesión sigue activa')
    expect(screen.getByText('demo@rag-test-studio.local')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText('demo@rag-test-studio.local')).toBeInTheDocument()
    // El botón pulsado desaparece con el banner: el foco pasa a `main`, no se pierde en <body>.
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('HU62: «Cerrar» del banner «Identidad no disponible» también mueve el foco a main', async () => {
    localStorage.setItem('rag-console.mock-session', storedSession)
    const user = userEvent.setup()
    renderShell()
    await screen.findByText('demo@rag-test-studio.local')
    act(() => notifyAuthError({ status: 503, code: 'IDENTITY_UNAVAILABLE' }))
    await user.click(await screen.findByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
  })
})
