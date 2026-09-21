import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockCreateProject, mockSimulateAppAccessLoss, resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { mockAuthAdapter } from '../auth/adapters/mockAuthAdapter'
import { setAuthModeForTests } from '../auth/authMode'
import { deleteProject } from '../projects/api'
import { createRepositoryBinding, disconnectRepository, verifyGitHubAppAccess } from './api'
import { IntegrationsPage } from './IntegrationsPage'

const SESSION_KEY = 'rag-console.mock-session'
const DEMO_USER = { id: 'user_demo_github', email: 'demo@rag-test-studio.local' }

function seedSession(githubProviderToken: string | null) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: DEMO_USER, accessToken: 'mock-github-session-token', githubProviderToken }))
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
  resetMockBackend()
})

/** El mock siembra dos proyectos vinculados; para el flujo de vinculación se necesita uno que nunca lo estuvo. */
async function createUnboundProject(): Promise<string> {
  const project = await mockCreateProject({ name: 'sin-binding' })
  return project.id
}

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
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
  expect(screen.getByText(/Desconectar pausa la recepción de eventos de PR; no borra Runs ni Functional Knowledge y puedes reactivarlo/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reactivar' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByText(/Repositorio desconectado: la recepción de eventos de PR quedó pausada/)).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Repositorio desconectado')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reactivar' })).toHaveFocus())
  // Desconectar es una pausa (DISABLED), no un borrado: el repositorio sigue visible y no reaparece el buscador.
  expect(await screen.findByText('Pausado')).toBeInTheDocument()
  expect(screen.getByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reactivar' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Desconectar' })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Buscar repositorio')).not.toBeInTheDocument()
})

test('HU57: Reactivar devuelve un binding DISABLED a ENABLED y lo marca como DEMO', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  await disconnectRepository('prj_checkout_demo')
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('Pausado')).toBeInTheDocument()
  expect(screen.getByText('DEMO · REACTIVAR SIMULADO')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reactivar' }))

  expect(await screen.findByText('Activo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Desconectar' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Repositorio reactivado')
  // El botón pulsado desaparece: el foco pasa al botón opuesto.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Desconectar' })).toHaveFocus())
})

test('HU57: un binding REVOKED explica la pérdida de acceso y Reactivar revalida', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  mockSimulateAppAccessLoss('prj_checkout_demo')
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('Revocado')).toBeInTheDocument()
  expect(screen.getByText(/La GitHub App perdió acceso al repositorio/)).toBeInTheDocument()
  // Con la App ya autorizada de nuevo (checkout siempre lo está en el mock) no se ofrece configurar nada.
  expect(screen.queryByRole('link', { name: /Configurar acceso de la GitHub App/ })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reactivar' }))

  expect(await screen.findByText('Activo')).toBeInTheDocument()
})

test('HU57: reactivar un REVOKED sin acceso de la App muestra el error con correlationId y el enlace para configurar la App', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  const projectId = await createUnboundProject()
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await createRepositoryBinding(projectId, { repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground', integrationBranch: 'main' })
  mockSimulateAppAccessLoss(projectId)
  renderIntegrations(projectId)

  expect(await screen.findByRole('link', { name: /Configurar acceso de la GitHub App/ })).toHaveAttribute('href', expect.stringContaining('github.com'))
  await user.click(await screen.findByRole('button', { name: 'Reactivar' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('La GitHub App no tiene acceso al repositorio')
  expect(alert).toHaveTextContent('demo-correlation-id')
  expect(screen.getByText('Revocado')).toBeInTheDocument()
})

test('HU56: un proyecto eliminado muestra "El proyecto ya no existe" con enlace a Proyectos y sin Reintentar', async () => {
  seedSession('mock-github-provider-token')
  await deleteProject('prj_checkout_demo')
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('El proyecto ya no existe')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a Proyectos' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
})

test('un fallo al desconectar muestra el error con role="alert" y correlationId', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations('prj_checkout_demo')
  await screen.findByText('Activo')
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'stack interno', correlationId: 'corr-123' }), { status: 500 }))
  setDataSourceForTests('live')

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('RAG Core no pudo completar la operación')
  expect(alert).toHaveTextContent('corr-123')
  expect(alert).not.toHaveTextContent('stack interno')
})

test('HU62: sin acceso GitHub en la sesión, «Renovar acceso a GitHub» lo restablece y habilita el descubrimiento (sin «Conectar GitHub»)', async () => {
  seedSession(null)
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())

  expect(await screen.findByText('Renueva tu acceso a GitHub')).toBeInTheDocument()
  expect(screen.queryByLabelText('Buscar repositorio')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Conectar GitHub' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Renovar acceso a GitHub' }))
  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})

test('HU62: «Renovar acceso a GitHub» vuelve a la ruta actual (redirectTo) y queda en «Renovando…» mientras el navegador redirige', async () => {
  seedSession(null)
  const user = userEvent.setup()
  const signIn = vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockResolvedValue(null)
  const projectId = await createUnboundProject()
  renderIntegrations(projectId)

  await user.click(await screen.findByRole('button', { name: 'Renovar acceso a GitHub' }))

  expect(signIn).toHaveBeenCalledWith(`/projects/${projectId}/integrations/github`)
  expect(screen.getByRole('button', { name: 'Renovando…' })).toBeDisabled()
})

test('HU62: si renovar el acceso falla, muestra el error con el patrón de error, no filtra el detalle y ofrece «Reintentar»', async () => {
  seedSession(null)
  const user = userEvent.setup()
  const signIn = vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockRejectedValueOnce(new Error('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.'))
  renderIntegrations(await createUnboundProject())

  await user.click(await screen.findByRole('button', { name: 'Renovar acceso a GitHub' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveClass('inline-error')
  expect(alert).toHaveTextContent('No pudimos completar el acceso con GitHub')
  expect(screen.getByRole('button', { name: 'Renovar acceso a GitHub' })).toBeEnabled()

  signIn.mockRestore()
  await user.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})

test('HU62: tras un pageshow persistido (Atrás desde GitHub, bfcache) «Renovando…» vuelve a «Renovar acceso a GitHub»', async () => {
  seedSession(null)
  const user = userEvent.setup()
  vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockResolvedValue(null)
  renderIntegrations(await createUnboundProject())

  await user.click(await screen.findByRole('button', { name: 'Renovar acceso a GitHub' }))
  expect(await screen.findByRole('button', { name: 'Renovando…' })).toBeDisabled()

  act(() => { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })) })
  expect(screen.getByRole('button', { name: 'Renovar acceso a GitHub' })).toBeEnabled()
})

test('HU30: camino feliz — repo AUTHORIZED de una, elige rama real y crea el binding', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  await user.type(screen.getByLabelText('Buscar repositorio'), 'notifications')
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))

  expect(await screen.findByText('Acceso autorizado a acme/notifications-service')).toBeInTheDocument()
  const branchSelect = await screen.findByLabelText('Integration branch') as HTMLSelectElement
  expect(Array.from(branchSelect.options).map((option) => option.value)).toEqual(expect.arrayContaining(['main', 'develop', 'feature/webhooks-v2']))

  await user.selectOptions(branchSelect, 'develop')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  expect(await screen.findByText('notifications-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
  expect(screen.getByText('develop')).toBeInTheDocument()
})

test('HU30: repo NOT_AUTHORIZED muestra CTA de configuración y "Revalidar" la autoriza', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
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
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await screen.findByText('Acceso autorizado a acme/notifications-service')

  await user.click(screen.getByRole('button', { name: 'Elegir otro repositorio' }))
  expect(await screen.findByLabelText('Buscar repositorio')).toBeInTheDocument()
})

test('409 REPOSITORY_ALREADY_BOUND muestra el mensaje de dominio, conserva repo y rama y no bloquea el botón', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  // `acme/checkout-service` ya está vinculado al Project demo prj_checkout_demo.
  await user.click(await screen.findByRole('button', { name: /checkout-service/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'develop')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Este repositorio ya está vinculado a otro proyecto. Elige otro repositorio.')
  expect(screen.getByLabelText('Integration branch')).toHaveValue('develop')
  expect(screen.getByText('Acceso autorizado a acme/checkout-service')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Vincular repositorio' })).toBeEnabled()

  // Se puede elegir otro repositorio y vincularlo tras el 409.
  await user.click(screen.getByRole('button', { name: 'Elegir otro repositorio' }))
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'develop')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))
  expect(await screen.findByText('notifications-service', { selector: '.repo-name' })).toBeInTheDocument()
})

test('409 REPOSITORY_BINDING_ALREADY_EXISTS relee el binding y la pantalla muestra el binding real en vez de seguir ofreciendo vincular', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  const projectId = await createUnboundProject()
  renderIntegrations(projectId)
  await screen.findByLabelText('Buscar repositorio')
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'develop')
  // Otro cliente vincula el proyecto entre que se abrió la pantalla y se confirmó.
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await createRepositoryBinding(projectId, { repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground', integrationBranch: 'main' })
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  expect(await screen.findByText('integration-playground', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Vincular repositorio' })).not.toBeInTheDocument()
})

test('403 GITHUB_APP_ACCESS_REQUIRED al vincular revalida y muestra el enlace para configurar la App, sin perder el repo elegido', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  // Otro Project deja `repo_playground` autorizado para que la UI lo vea `AUTHORIZED`, y luego pierde acceso (la verificación se olvida).
  const other = await createUnboundProject()
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
  await createRepositoryBinding(other, { repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground', integrationBranch: 'main' })
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')
  await user.click(await screen.findByRole('button', { name: /integration-playground/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'main')
  mockSimulateAppAccessLoss(other)

  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  expect(await screen.findByText(/no tiene acceso a demo-user\/integration-playground/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Configurar acceso en GitHub →' }).getAttribute('href')).toMatch(/github\.com/)
  // El error del 403 no se pierde al pasar a NOT_AUTHORIZED: sigue anunciado como alerta y el panel de acceso como estado.
  expect(screen.getByRole('alert')).toHaveTextContent('La GitHub App no tiene acceso al repositorio')
  expect(screen.getAllByRole('status').some((node) => /no tiene acceso a demo-user\/integration-playground/.test(node.textContent ?? ''))).toBe(true)

  // «Revalidar» es un intento nuevo: el error anterior se limpia.
  await user.click(screen.getByRole('button', { name: 'Revalidar' }))
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
})

test('un 409 de un repositorio A no reaparece al elegir otro repositorio B', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  await user.click(await screen.findByRole('button', { name: /checkout-service/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'develop')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Este repositorio ya está vinculado a otro proyecto')

  await user.click(screen.getByRole('button', { name: 'Elegir otro repositorio' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await screen.findByText('Acceso autorizado a acme/notifications-service')
  expect(screen.queryByText(/ya está vinculado a otro proyecto/)).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('HU64: los repos con permiso solo de lectura se muestran como no vinculables, con texto que lo explica', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  const readOnly = await screen.findByRole('button', { name: /legacy-docs/ })
  expect(readOnly).toBeDisabled()
  expect(readOnly).toHaveTextContent('No vinculable')
  expect(readOnly).toHaveAccessibleDescription(/Necesitas permiso maintain, write o admin/)
  // Un repo con permiso suficiente sigue siendo elegible.
  expect(screen.getByRole('button', { name: /notifications-service/ })).toBeEnabled()

  await user.click(readOnly)
  expect(screen.queryByText(/Verificando acceso de la App/)).not.toBeInTheDocument()
})

test('HU64: un repo de propietario ajeno responde 400 REPOSITORY_OUTSIDE_WORKSPACE y se muestra su mensaje, sin bloquear el botón', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')

  await user.click(await screen.findByRole('button', { name: /shared-tools/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'main')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Este repositorio no pertenece a tu cuenta; en un proyecto personal solo puedes vincular repositorios propios.')
  expect(screen.getByRole('button', { name: 'Vincular repositorio' })).toBeEnabled()
})

test('un 5xx al vincular muestra un mensaje genérico con correlationId', async () => {
  seedSession('mock-github-provider-token')
  const user = userEvent.setup()
  renderIntegrations(await createUnboundProject())
  await screen.findByLabelText('Buscar repositorio')
  await user.click(await screen.findByRole('button', { name: /notifications-service/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'develop')
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'P2002 unique constraint', correlationId: 'corr-500' }), { status: 500 }))

  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('RAG Core no pudo completar la operación')
  expect(alert).toHaveTextContent('corr-500')
  expect(alert).not.toHaveTextContent('P2002')
  expect(within(alert).getByText('corr-500')).toBeInTheDocument()
})
