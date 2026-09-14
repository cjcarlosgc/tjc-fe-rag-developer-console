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

  expect(await screen.findByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
})

test('HU30: sin binding, el flujo de 2 pasos reconecta el repositorio elegido en el selector', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByText('Sin repositorio vinculado')

  await user.click(screen.getByRole('button', { name: 'Conectar GitHub App' }))
  expect(await screen.findByText('Instalación simulada iniciada')).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Repositorio a autorizar'), 'acme/billing-engine')
  await user.click(screen.getByRole('button', { name: 'Simular instalación completada' }))
  expect(await screen.findByText('billing-engine', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()
})

test('el selector de repositorio ofrece más de un repo candidato y respeta la elección', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByText('Sin repositorio vinculado')
  await user.click(screen.getByRole('button', { name: 'Conectar GitHub App' }))
  await screen.findByText('Instalación simulada iniciada')

  const picker = screen.getByLabelText('Repositorio a autorizar') as HTMLSelectElement
  expect(Array.from(picker.options).map((option) => option.textContent)).toEqual(['acme/checkout-service', 'acme/billing-engine', 'acme/notifications-service'])

  await user.selectOptions(picker, 'acme/notifications-service')
  await user.click(screen.getByRole('button', { name: 'Simular instalación completada' }))
  expect(await screen.findByText('notifications-service', { selector: '.repo-name' })).toBeInTheDocument()
})
