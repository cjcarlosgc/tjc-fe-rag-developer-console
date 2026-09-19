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

const SESSION_KEY = 'rag-console.mock-session'
const EMAIL_USER = { id: 'user_demo_local', email: 'demo@rag-test-studio.local' }

function seedEmailSession(githubProviderToken: string | null) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: EMAIL_USER, accessToken: 'mock-session-token', githubProviderToken }))
}

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
  seedEmailSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})

test('HU30: sin GitHub vinculado, el CTA conecta la sesión y habilita el descubrimiento', async () => {
  seedEmailSession(null)
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByText('Conecta tu cuenta de GitHub')).toBeInTheDocument()
  expect(screen.queryByLabelText('Buscar repositorio')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Conectar GitHub' }))
  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})

test('HU30: camino feliz — repo AUTHORIZED de una, elige rama real y crea el binding', async () => {
  seedEmailSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByLabelText('Buscar repositorio')

  await user.type(screen.getByLabelText('Buscar repositorio'), 'notifications')
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))

  expect(await screen.findByText('Acceso autorizado a acme/notifications-service')).toBeInTheDocument()
  const branchSelect = await screen.findByLabelText('Integration branch') as HTMLSelectElement
  expect(Array.from(branchSelect.options).map((option) => option.value)).toEqual(expect.arrayContaining(['main', 'develop', 'feature/webhooks-v2']))

  await user.selectOptions(branchSelect, 'develop')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  expect(await screen.findByText('notifications-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()
  expect(screen.getByText('develop')).toBeInTheDocument()
})

test('HU30: repo NOT_AUTHORIZED muestra CTA de configuración y "Revalidar" la autoriza', async () => {
  seedEmailSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByLabelText('Buscar repositorio')

  await user.type(screen.getByLabelText('Buscar repositorio'), 'playground')
  await user.click(await screen.findByRole('button', { name: /integration-playground/ }))

  expect(await screen.findByText(/no tiene acceso a demo-user\/integration-playground/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Configurar acceso en GitHub →' }).getAttribute('href')).toMatch(/github\.com/)
  expect(screen.queryByLabelText('Integration branch')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Revalidar' }))
  expect(await screen.findByText('Acceso autorizado a demo-user/integration-playground')).toBeInTheDocument()

  const branchSelect = await screen.findByLabelText('Integration branch') as HTMLSelectElement
  await user.selectOptions(branchSelect, 'main')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))
  expect(await screen.findByText('integration-playground', { selector: '.repo-name' })).toBeInTheDocument()
})

test('permite elegir otro repositorio antes de confirmar el binding', async () => {
  seedEmailSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByLabelText('Buscar repositorio')

  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await screen.findByText('Acceso autorizado a acme/notifications-service')

  await user.click(screen.getByRole('button', { name: 'Elegir otro repositorio' }))
  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})
