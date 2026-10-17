import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'

// WI-CONSOLE-036 ciclo 3: reproduce el cliente de main.tsx (retry:1, refetchOnWindowFocus:false).
// Con getExperiment que siempre rechaza, la pantalla debe llegar al alert con «Reintentar» en tiempo acotado.
const harness = vi.hoisted(() => ({ calls: 0 }))

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    getExperiment: () => {
      harness.calls += 1
      return Promise.reject(new ApiError('Experimento no encontrado', 404, 'corr-retry', 'NOT_FOUND'))
    },
  }
})

// Import tras el mock para que ExperimentPage reciba la versión mockeada.
const { ExperimentPage } = await import('./ExperimentPage')

beforeEach(() => {
  resetMockBackend()
  harness.calls = 0
  setDataSourceForTests('mock')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

test('WI-CONSOLE-036 ciclo 3: con el cliente de main.tsx, un experimentId que falla llega al alert con Reintentar e Iniciar otra comparación', async () => {
  // Fuera del modo test, el sondeo usa 560 ms como en el navegador real.
  vi.stubEnv('MODE', 'development')
  const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/projects/prj_checkout_demo/experimental?analysisRunId=run-1&experimentId=nope-404']}>
        <Routes>
          <Route path="/projects/:projectId/experimental" element={<ExperimentPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
  expect(alert).toHaveTextContent('No se pudo cargar el experimento')
  expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  expect(within(alert).getByRole('button', { name: 'Iniciar otra comparación' })).toBeInTheDocument()
  expect(screen.queryByText('Preparando experimento')).toBeNull()
  expect(harness.calls).toBe(1)
})

test('WI-CONSOLE-036 ciclo 3 (hipótesis foco): con el documento sin foco y el cliente de main.tsx, el error llega al alert en 5 s', async () => {
  // Reproduce el panel del navegador (visibilityState=hidden): TanStack pausa el reintento sin foco.
  focusManager.setFocused(false)
  try {
    vi.stubEnv('MODE', 'development')
    const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/projects/prj_checkout_demo/experimental?analysisRunId=run-1&experimentId=nope-404']}>
          <Routes>
            <Route path="/projects/:projectId/experimental" element={<ExperimentPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Iniciar otra comparación' })).toBeInTheDocument()
    expect(harness.calls).toBe(1)
  } finally {
    focusManager.setFocused(undefined)
  }
})
