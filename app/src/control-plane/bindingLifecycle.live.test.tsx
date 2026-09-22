import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import { ProjectDetailPage } from '../projects/ProjectDetailPage'
import { IntegrationsPage } from './IntegrationsPage'

// HU57/HU56: con INTEROP-2.3 implementado en Core (CS-20260920-003), Reactivar y Eliminar funcionan en live contra las rutas reales,
// sin sellos DEMO. Aquí se simula Core con `fetch`; no se toca el mock.

function authValue(githubProviderToken: string | null): AuthContextValue {
  return {
    status: 'authenticated',
    session: { user: { id: 'user_1', email: 'dev@example.com' }, accessToken: 'token', githubProviderToken },
    signInWithGitHub: async () => false,
    oauthError: null,
    dismissOAuthError: () => undefined,
    sessionNotice: null,
    dismissSessionNotice: () => undefined,
    signOut: async () => undefined,
  }
}

const binding = { projectId: 'prj_real', installationId: 'inst_1', repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main', status: 'DISABLED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const project = { id: 'prj_real', name: 'proyecto-real', currentVersionId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const appAccess = { repositoryId: 'repo_1', repositoryName: 'acme/repo', status: 'NOT_AUTHORIZED', installationId: null, app: { displayName: 'RAG', configureUrl: 'https://github.com/apps/rag/installations/select_target' } }

const repository = { repositoryId: 'repo_1', name: 'repo', repositoryName: 'acme/repo', owner: { login: 'acme', type: 'Organization', avatarUrl: null }, private: false, defaultBranch: 'main', permissions: { admin: false, maintain: true, push: true, pull: true } }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const coreError = (code: string, status: number, correlationId = 'corr-core') => json({ code, message: 'mensaje crudo de Core', correlationId }, status)

interface Request { url: string; method: string }
/** Estado de la "Core" simulada, mutable por test. */
let requests: Request[] = []
let coreBinding: () => Response
let coreProject: () => Response
let coreEnable: () => Response
let coreDelete: () => Response
let coreCreateBinding: () => Response
let coreVerifyAccess: () => Response
let coreRepositories: () => Response

beforeEach(() => {
  setDataSourceForTests('live')
  requests = []
  coreBinding = () => json(binding)
  coreProject = () => json(project)
  coreEnable = () => json({ ...binding, status: 'ENABLED' })
  coreDelete = () => new Response(null, { status: 204 })
  coreCreateBinding = () => json({ ...binding, status: 'ENABLED' }, 201)
  coreVerifyAccess = () => json(appAccess)
  coreRepositories = () => json({ items: [repository], nextCursor: null })
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    requests.push({ url, method })
    if (url.endsWith('/integrations/github/repositories/verify-app-access')) return coreVerifyAccess()
    if (url.endsWith('/integrations/github/repositories')) return coreRepositories()
    if (url.endsWith('/integrations/github/repositories/acme/repo/branches')) return json({ items: [{ name: 'main', protected: true }] })
    if (url.endsWith('/projects/prj_real/integrations/github/enable')) return coreEnable()
    if (url.endsWith('/projects/prj_real/integrations/github')) return method === 'POST' ? coreCreateBinding() : method === 'DELETE' ? new Response(null, { status: 204 }) : coreBinding()
    if (url.endsWith('/projects/prj_real')) return method === 'DELETE' ? coreDelete() : coreProject()
    return coreError('NOT_FOUND', 404)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  setDataSourceForTests(null)
})

/** Muestra el aviso que la lista de proyectos leería del `state` de navegación, sin montar la lista real (que en live agrega Runs cross-proyecto). */
function ListProbe() {
  const location = useLocation()
  return <p>Lista de proyectos · {JSON.stringify(location.state)}</p>
}

function renderLive(path: string, element: React.ReactElement, routePath: string, githubProviderToken: string | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={authValue(githubProviderToken)}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<ListProbe />} />
            <Route path={routePath} element={element} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

const renderIntegrations = (githubProviderToken: string | null = null) =>
  renderLive('/projects/prj_real/integrations/github', <IntegrationsPage />, '/projects/:projectId/integrations/github', githubProviderToken)
const renderDetail = () => renderLive('/projects/prj_real', <ProjectDetailPage />, '/projects/:projectId')

const wasCalled = (method: string, suffix: string) => requests.some((request) => request.method === method && request.url.endsWith(suffix))

test('en live Reactivar está habilitado, llama a POST .../integrations/github/enable y deja el binding Activo, sin sellos DEMO', async () => {
  const user = userEvent.setup()
  renderIntegrations()

  const button = await screen.findByRole('button', { name: 'Reactivar' })
  expect(screen.getByText('Pausado')).toBeInTheDocument()
  expect(button).toBeEnabled()
  expect(button).not.toHaveAttribute('aria-disabled')
  expect(screen.queryByText(/pendiente de Core/)).not.toBeInTheDocument()

  await user.click(button)

  expect(await screen.findByText('Activo')).toBeInTheDocument()
  expect(wasCalled('POST', '/projects/prj_real/integrations/github/enable')).toBe(true)
  expect(screen.getByRole('status')).toHaveTextContent('Repositorio reactivado')
  expect(screen.queryByText(/DEMO/)).not.toBeInTheDocument()
})

test('en live Desconectar promete lo mismo que en mock: se puede reactivar', async () => {
  coreBinding = () => json({ ...binding, status: 'ENABLED' })
  renderIntegrations()

  expect(await screen.findByRole('button', { name: 'Desconectar' })).toBeInTheDocument()
  expect(screen.getByText(/y puedes reactivarlo/)).toBeInTheDocument()
  expect(screen.queryByText(/aún no está disponible/)).not.toBeInTheDocument()
  expect(screen.queryByText(/DEMO/)).not.toBeInTheDocument()
})

test('en live un binding REVOKED cuya App ya tiene acceso (AUTHORIZED) no ofrece el enlace de configuración', async () => {
  coreBinding = () => json({ ...binding, status: 'REVOKED' })
  coreVerifyAccess = () => json({ ...appAccess, status: 'AUTHORIZED', installationId: 'inst_1' })
  renderIntegrations()

  await screen.findByText('Revocado')
  await waitFor(() => expect(requests.some((request) => request.url.endsWith('/verify-app-access'))).toBe(true))
  expect(screen.queryByRole('link', { name: /Configurar acceso de la GitHub App/ })).not.toBeInTheDocument()
})

test('en live Reactivar un REVOKED sin acceso: 403 muestra el error con correlationId, el estado no cambia y se ofrece la configureUrl', async () => {
  const user = userEvent.setup()
  coreBinding = () => json({ ...binding, status: 'REVOKED' })
  coreEnable = () => coreError('GITHUB_APP_ACCESS_REQUIRED', 403, 'corr-403')
  renderIntegrations()

  // La configureUrl se ofrece de entrada (verify-app-access), sin esperar a que Reactivar falle.
  const link = await screen.findByRole('link', { name: /Configurar acceso de la GitHub App/ })
  expect(link).toHaveAttribute('href', 'https://github.com/apps/rag/installations/select_target')
  await user.click(screen.getByRole('button', { name: 'Reactivar' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('La GitHub App no tiene acceso al repositorio')
  expect(alert).toHaveTextContent('corr-403')
  expect(alert).not.toHaveTextContent('mensaje crudo de Core')
  expect(screen.getByText('Revocado')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reactivar' })).toBeEnabled()
})

test('en live Reactivar con 404 PROJECT_NOT_FOUND (Project borrado) lleva a "El proyecto ya no existe"', async () => {
  const user = userEvent.setup()
  coreEnable = () => {
    coreBinding = () => coreError('PROJECT_NOT_FOUND', 404)
    return coreError('PROJECT_NOT_FOUND', 404)
  }
  renderIntegrations()

  await user.click(await screen.findByRole('button', { name: 'Reactivar' }))

  expect(await screen.findByText('El proyecto ya no existe')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a Proyectos' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
})

test('en live 404 REPOSITORY_BINDING_NOT_FOUND es solo "Project vivo sin binding" (flujo de vincular) y 404 PROJECT_NOT_FOUND es "el proyecto ya no existe"', async () => {
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  const { unmount } = renderIntegrations()
  expect(await screen.findByText('Renueva tu acceso a GitHub')).toBeInTheDocument()
  expect(screen.queryByText('El proyecto ya no existe')).not.toBeInTheDocument()
  unmount()

  coreBinding = () => coreError('PROJECT_NOT_FOUND', 404)
  renderIntegrations()
  expect(await screen.findByText('El proyecto ya no existe')).toBeInTheDocument()
  expect(screen.queryByText('Renueva tu acceso a GitHub')).not.toBeInTheDocument()
})

test('en live 404 GITHUB_REPOSITORY_NOT_FOUND al vincular muestra un único mensaje neutral (no encontrado o sin permiso), conserva repo y rama y no bloquea el botón', async () => {
  const user = userEvent.setup()
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreCreateBinding = () => coreError('GITHUB_REPOSITORY_NOT_FOUND', 404, 'corr-gh')
  // verify-app-access autoriza para que la UI llegue al paso de vincular.
  coreVerifyAccess = () => json({ ...appAccess, status: 'AUTHORIZED', installationId: 'inst_1' })
  renderIntegrations('gho_token')

  await user.click(await screen.findByRole('button', { name: /repo/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'main')
  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No encontramos ese repositorio o no tienes permiso sobre él. Vuelve a elegirlo de la lista.')
  expect(alert).toHaveTextContent('corr-gh')
  expect(screen.getByLabelText('Integration branch')).toHaveValue('main')
  expect(screen.getByText('Acceso autorizado a acme/repo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Vincular repositorio' })).toBeEnabled()
  expect(wasCalled('POST', '/projects/prj_real/integrations/github')).toBe(true)
})

test('en live "Eliminar proyecto" está habilitado, pide confirmación, llama a DELETE /projects/{id} y navega a la lista con el aviso, sin sellos DEMO', async () => {
  const user = userEvent.setup()
  renderDetail()

  const button = await screen.findByRole('button', { name: 'Eliminar proyecto' })
  expect(button).toBeEnabled()
  expect(button).not.toHaveAttribute('aria-disabled')
  expect(screen.queryByText(/pendiente de Core/)).not.toBeInTheDocument()
  expect(screen.queryByText(/DEMO/)).not.toBeInTheDocument()

  await user.click(button)
  await user.click(screen.getByRole('button', { name: 'Eliminar proyecto-real' }))

  expect(await screen.findByText(/Lista de proyectos/)).toHaveTextContent('"deletedProjectName":"proyecto-real"')
  expect(wasCalled('DELETE', '/projects/prj_real')).toBe(true)
})

test('en live un reintento de eliminar que responde 404 PROJECT_NOT_FOUND se trata como éxito y navega a la lista', async () => {
  const user = userEvent.setup()
  coreDelete = () => coreError('PROJECT_NOT_FOUND', 404)
  renderDetail()

  await user.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }))
  await user.click(screen.getByRole('button', { name: 'Eliminar proyecto-real' }))

  expect(await screen.findByText(/Lista de proyectos/)).toBeInTheDocument()
})

test('en live un 5xx al eliminar muestra un mensaje genérico con correlationId y no navega', async () => {
  const user = userEvent.setup()
  coreDelete = () => coreError('INTERNAL_ERROR', 500, 'corr-del')
  renderDetail()

  await user.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }))
  await user.click(screen.getByRole('button', { name: 'Eliminar proyecto-real' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('RAG Core no pudo completar la operación')
  expect(alert).toHaveTextContent('corr-del')
  expect(alert).not.toHaveTextContent('mensaje crudo de Core')
  expect(screen.queryByText(/Lista de proyectos/)).not.toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Eliminar proyecto-real' })).toBeEnabled())
})

test('en live un 404 PROJECT_NOT_FOUND al abrir el proyecto muestra "El proyecto ya no existe" sin Reintentar, pero otros errores conservan Reintentar', async () => {
  coreProject = () => coreError('PROJECT_NOT_FOUND', 404)
  const { unmount } = renderDetail()
  expect(await screen.findByText('El proyecto ya no existe')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  unmount()

  coreProject = () => coreError('INTERNAL_ERROR', 500)
  renderDetail()
  expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
})

/** Deja la pantalla lista para pulsar «Vincular repositorio» contra una Core simulada que ya autorizó a la App. */
async function reachBindStep(user: ReturnType<typeof userEvent.setup>) {
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreVerifyAccess = () => json({ ...appAccess, status: 'AUTHORIZED', installationId: 'inst_1' })
  renderIntegrations('gho_token')
  await user.click(await screen.findByRole('button', { name: /repo/ }))
  await user.selectOptions(await screen.findByLabelText('Integration branch'), 'main')
}

test.each([
  ['REPOSITORY_OUTSIDE_WORKSPACE', 400, 'Este repositorio no pertenece a tu cuenta; en un proyecto personal solo puedes vincular repositorios propios.'],
  ['REPOSITORY_PERMISSION_INSUFFICIENT', 403, 'Necesitas permiso maintain, write o admin sobre este repositorio.'],
])('HU64: en live %s al vincular muestra su mensaje claro con correlationId y sin el mensaje crudo de Core', async (code, status, message) => {
  const user = userEvent.setup()
  coreCreateBinding = () => coreError(code, status, 'corr-64')
  await reachBindStep(user)

  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(message)
  expect(alert).toHaveTextContent('corr-64')
  expect(alert).not.toHaveTextContent('mensaje crudo de Core')
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
})

test('HU64: en live 503 GITHUB_VERIFICATION_UNAVAILABLE al vincular es reintentable, no afirma que no exista ni que falte permiso y «Reintentar» repite el POST', async () => {
  const user = userEvent.setup()
  coreCreateBinding = () => coreError('GITHUB_VERIFICATION_UNAVAILABLE', 503, 'corr-503')
  await reachBindStep(user)

  await user.click(screen.getByRole('button', { name: 'Vincular repositorio' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No pudimos verificar el permiso en GitHub ahora; inténtalo de nuevo.')
  expect(alert).toHaveTextContent('corr-503')
  expect(alert).not.toHaveTextContent(/no existe|no encontramos|no tienes|necesitas/i)

  coreCreateBinding = () => json({ ...binding, status: 'ENABLED' }, 201)
  await user.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByText('Activo')).toBeInTheDocument()
  expect(requests.filter((request) => request.method === 'POST' && request.url.endsWith('/projects/prj_real/integrations/github'))).toHaveLength(2)
})

test('HU64: en live 503 GITHUB_VERIFICATION_UNAVAILABLE en verify-app-access ofrece «Reintentar» sin decir que el repositorio no existe', async () => {
  const user = userEvent.setup()
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreVerifyAccess = () => coreError('GITHUB_VERIFICATION_UNAVAILABLE', 503, 'corr-v')
  renderIntegrations('gho_token')
  await user.click(await screen.findByRole('button', { name: /repo/ }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No pudimos verificar el permiso en GitHub ahora; inténtalo de nuevo.')
  expect(alert).not.toHaveTextContent(/no existe|no encontramos/i)

  coreVerifyAccess = () => json({ ...appAccess, status: 'AUTHORIZED', installationId: 'inst_1' })
  await user.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByText('Acceso autorizado a acme/repo')).toBeInTheDocument()
})

test('HU64: en live 503 al listar ramas ofrece «Reintentar»', async () => {
  const user = userEvent.setup()
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreVerifyAccess = () => json({ ...appAccess, status: 'AUTHORIZED', installationId: 'inst_1' })
  let branchesOk = false
  const previous = vi.mocked(globalThis.fetch).getMockImplementation()!
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    if (String(input).endsWith('/integrations/github/repositories/acme/repo/branches') && !branchesOk) return coreError('GITHUB_VERIFICATION_UNAVAILABLE', 503)
    return previous(input, init)
  })
  renderIntegrations('gho_token')
  await user.click(await screen.findByRole('button', { name: /repo/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos verificar el permiso en GitHub ahora; inténtalo de nuevo.')
  branchesOk = true
  await user.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByLabelText('Integration branch')).toBeInTheDocument()
})

test('HU64: en live la lista deshabilita los repos read/triage con texto explicativo; el rechazo autoritativo sigue siendo el POST', async () => {
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreRepositories = () => json({
    items: [
      repository,
      { ...repository, repositoryId: 'repo_ro', name: 'ro', repositoryName: 'acme/ro', permissions: { admin: false, maintain: false, push: false, pull: true } },
    ],
    nextCursor: null,
  })
  renderIntegrations('gho_token')

  const readOnly = await screen.findByRole('button', { name: /acme\/ro/ })
  expect(readOnly).toBeDisabled()
  expect(readOnly).toHaveTextContent('No vinculable')
  expect(readOnly).toHaveAccessibleDescription(/Necesitas permiso maintain, write o admin/)
  expect(screen.getByRole('button', { name: /acme\/repo/ })).toBeEnabled()
})

test('HU64: verify-app-access responde 200 con NOT_AUTHORIZED y la UI no depende del 201', async () => {
  const user = userEvent.setup()
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreVerifyAccess = () => json(appAccess, 200)
  renderIntegrations('gho_token')
  await user.click(await screen.findByRole('button', { name: /repo/ }))
  expect(await screen.findByText(/no tiene acceso a acme\/repo/)).toBeInTheDocument()
})

test.each([
  ['GITHUB_REPOSITORY_NOT_FOUND', 404],
  ['REPOSITORY_OUTSIDE_WORKSPACE', 400],
])('HU64: Reactivar con %s no dice «Vuelve a elegirlo de la lista» y apunta a crear un proyecto nuevo', async (code, status) => {
  const user = userEvent.setup()
  coreEnable = () => coreError(code, status, 'corr-react')
  renderIntegrations()

  await user.click(await screen.findByRole('button', { name: 'Reactivar' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('El repositorio ya no está disponible para este proyecto; si necesitas otro, elimina el proyecto y crea uno nuevo.')
  expect(alert).toHaveTextContent('corr-react')
  expect(alert).not.toHaveTextContent(/elegirlo|lista/)
})

test('H4: el error de carga del binding pasa por el mapeo por código con correlationId, sin el mensaje crudo de Core', async () => {
  coreBinding = () => coreError('INTERNAL_ERROR', 500, 'corr-load')
  renderIntegrations()

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('RAG Core no pudo completar la operación')
  expect(alert).toHaveTextContent('corr-load')
  expect(alert).not.toHaveTextContent('mensaje crudo de Core')
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
})

test('H4: el error de carga de repositorios pasa por el mapeo por código con correlationId, sin el mensaje crudo de Core', async () => {
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreRepositories = () => coreError('INTERNAL_ERROR', 500, 'corr-repos')
  renderIntegrations('gho_token')

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('RAG Core no pudo completar la operación')
  expect(alert).toHaveTextContent('corr-repos')
  expect(alert).not.toHaveTextContent('mensaje crudo de Core')
})

test.each(['GITHUB_ACCOUNT_REQUIRED', 'GITHUB_USER_TOKEN_INVALID'])('M2: 401 %s en discovery no cierra la sesión y ofrece «Renovar acceso a GitHub» con mensaje claro', async (code) => {
  const user = userEvent.setup()
  coreBinding = () => coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
  coreRepositories = () => coreError(code, 401, 'corr-401')
  renderIntegrations('gho_token')

  expect(await screen.findByText(/Tu acceso a GitHub no está disponible o expiró/)).toBeInTheDocument()
  expect(screen.queryByText(/Tu sesión expiró/)).not.toBeInTheDocument()
  const renew = screen.getByRole('button', { name: 'Renovar acceso a GitHub' })
  await user.click(renew)
  expect(screen.getByRole('button', { name: 'Renovando…' })).toBeDisabled()
})
