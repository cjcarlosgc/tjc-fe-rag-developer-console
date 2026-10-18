import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { setAuthModeForTests } from '../auth/authMode'
import { AppShell } from './AppShell'
import { NotFoundPage } from './RouteError'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<div>Inicio</div>} />
              <Route path="analysis-runs" element={<div>Listado de Runs</div>} />
              <Route path="*" element={<NotFoundPage />} />
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
  resetMockBackend()
})

describe('navegación accesible del shell', () => {
  it('ofrece un enlace para saltar al contenido que mueve el foco al contenido principal', async () => {
    renderAt('/')
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
    await userEvent.click(skip)
    expect(document.getElementById('contenido')).toHaveFocus()
  })

  it('marca con aria-current la sección activa de la navegación principal', () => {
    renderAt('/analysis-runs')
    expect(screen.getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Action Required/ })).not.toHaveAttribute('aria-current')
  })

  it('actualiza el título del documento según la ruta', () => {
    renderAt('/analysis-runs')
    expect(document.title).toBe('Runs · RAG Test Studio')
  })

  it('una ruta inexistente muestra la página 404 dentro del shell, en español y con salida a Projects', () => {
    renderAt('/esta/ruta/no/existe')
    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a Projects' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    expect(document.title).toBe('Página no encontrada · RAG Test Studio')
  })
})
