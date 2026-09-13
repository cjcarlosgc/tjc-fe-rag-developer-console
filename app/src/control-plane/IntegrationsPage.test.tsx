import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { setAuthModeForTests } from '../auth/authMode'
import { IntegrationsPage } from './IntegrationsPage'

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderIntegrations(projectId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/projects/${projectId}/integrations/github`]}>
          <Routes><Route path="/projects/:projectId/integrations/github" element={<IntegrationsPage />} /></Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

test('HU30: muestra el binding ENABLED y permite desconectar', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('acme/checkout-service')).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
})

test('HU30: sin binding, el flujo de 2 pasos reconecta el repositorio', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByText('Sin repositorio vinculado')

  await user.click(screen.getByRole('button', { name: 'Conectar GitHub App' }))
  expect(await screen.findByText('Instalación simulada iniciada')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Simular instalación completada' }))
  expect(await screen.findByText('acme/billing-engine')).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()
})
