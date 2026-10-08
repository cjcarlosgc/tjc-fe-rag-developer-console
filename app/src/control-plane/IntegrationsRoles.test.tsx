import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { setAuthModeForTests } from '../auth/authMode'
import { IntegrationsPage } from './IntegrationsPage'

const SESSION_KEY = 'rag-console.mock-session'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id: 'user_demo_github', email: 'demo@rag-test-studio.local' }, accessToken: 'mock-github-session-token', githubProviderToken: 'mock-github-provider-token' }))
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

test('Integrations: Writer ve el vínculo activo y puede desconectarlo', async () => {
  renderIntegrations('prj_org_writer_demo')

  expect(await screen.findByRole('button', { name: 'Desconectar' })).toBeInTheDocument()
  expect(screen.queryByText(/Tu rol permite consultar el vínculo, pero no pausarlo/)).not.toBeInTheDocument()
})

test('Integrations: Reader ve el vínculo en solo lectura y no puede desconectarlo ni reactivarlo', async () => {
  renderIntegrations('prj_org_metrics_demo')

  expect(await screen.findByText('Tu rol permite consultar el vínculo, pero no pausarlo. Un Writer, Maintainer o Admin puede cambiarlo.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desconectar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reactivar' })).not.toBeInTheDocument()
})
