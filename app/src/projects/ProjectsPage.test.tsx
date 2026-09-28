import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockCreateProject, resetMockBackend } from '../api/mockBackend'
import { disconnectRepository } from '../control-plane/api'
import { controlPlaneKeys } from '../control-plane/queries'
import type { ProjectRepositoryBindingResponse } from '../control-plane/types'
import { renderApp } from '../test/render'
import { createProject, deleteProject, listAllProjects } from './api'
import { ProjectOverviewCard, ProjectsPage } from './ProjectsPage'
import type { Project } from './types'

afterEach(() => setDataSourceForTests(null))

const EMPTY_ACTION_REQUIRED_PAGE = JSON.stringify({ items: [], nextCursor: null })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

test('lista proyectos live con el contrato Page<ProjectResponse>', async () => {
  setDataSourceForTests('live')
  const workspaces = { items: [{ kind: 'PERSONAL', id: 'ws-1', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }] }
  const page = {
    items: [
      { id: 'p-1', name: 'live-project', currentVersionId: null, workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
    ],
    nextCursor: null,
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/workspaces')) return new Response(JSON.stringify(workspaces), { status: 200 })
    if (url.includes('/action-required') || url.includes('/analysis-runs')) return new Response(EMPTY_ACTION_REQUIRED_PAGE, { status: 200 })
    return new Response(JSON.stringify(page), { status: 200 })
  })
  renderApp(<ProjectsPage />)

  await waitFor(() => expect(screen.getByRole('heading', { name: 'live-project' })).toBeInTheDocument(), { timeout: 2000 })
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.anything())
})

test('no presenta cero métricas mientras todavía carga el inventario completo del workspace', async () => {
  setDataSourceForTests('live')
  const workspace = { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }
  const project = { id: 'p-1', name: 'live-project', currentVersionId: null, workspace, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const projectsPage = { items: [project], nextCursor: null }
  const binding: ProjectRepositoryBindingResponse = {
    projectId: 'p-1', installationId: 'inst-1', repositoryId: 'repo-1', repositoryName: 'demo-user/live-project',
    integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  }
  const allProjectsResponse = deferred<Response>()
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input), 'http://core.test')
    if (url.pathname.endsWith('/workspaces')) return new Response(JSON.stringify({ items: [workspace] }), { status: 200 })
    if (url.pathname.endsWith('/projects') && url.searchParams.get('limit') === '100') return allProjectsResponse.promise
    if (url.pathname.endsWith('/action-required') || url.pathname.endsWith('/analysis-runs')) return new Response(EMPTY_ACTION_REQUIRED_PAGE, { status: 200 })
    if (url.pathname.endsWith('/projects/p-1/integrations/github')) return new Response(JSON.stringify(binding), { status: 200 })
    return new Response(JSON.stringify(projectsPage), { status: 200 })
  })
  renderApp(<ProjectsPage />)

  expect(await screen.findByText('Cargando actividad y pendientes del workspace…')).toBeInTheDocument()
  expect(screen.queryByText('Sin análisis todavía')).not.toBeInTheDocument()
  const activePrKpi = screen.getByText('PR activos', { selector: '.kpi-card span' }).closest('.kpi-card')
  const actionRequiredKpi = screen.getByText('Action Required', { selector: '.kpi-card span' }).closest('.kpi-card')
  expect(activePrKpi).toHaveTextContent('—')
  expect(activePrKpi).not.toHaveTextContent('0')
  expect(actionRequiredKpi).toHaveTextContent('—')

  allProjectsResponse.resolve(new Response(JSON.stringify(projectsPage), { status: 200 }))
  expect(await screen.findByText(/Sin análisis todavía/)).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalled()
})

test('mantiene las tarjetas navegables y muestra métricas desconocidas cuando falla un agregado', async () => {
  setDataSourceForTests('live')
  const workspace = { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }
  const project = { id: 'p-1', name: 'live-project', currentVersionId: null, workspace, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const projectsPage = { items: [project], nextCursor: null }
  const binding: ProjectRepositoryBindingResponse = {
    projectId: 'p-1', installationId: 'inst-1', repositoryId: 'repo-1', repositoryName: 'demo-user/live-project',
    integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input), 'http://core.test')
    if (url.pathname.endsWith('/workspaces')) return new Response(JSON.stringify({ items: [workspace] }), { status: 200 })
    if (url.pathname.endsWith('/analysis-runs')) {
      return new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Falló el agregado', correlationId: 'runs-err' }), { status: 500 })
    }
    if (url.pathname.endsWith('/action-required')) return new Response(EMPTY_ACTION_REQUIRED_PAGE, { status: 200 })
    if (url.pathname.endsWith('/projects/p-1/integrations/github')) return new Response(JSON.stringify(binding), { status: 200 })
    return new Response(JSON.stringify(projectsPage), { status: 200 })
  })
  renderApp(<ProjectsPage />)

  await screen.findByRole('heading', { name: 'live-project' })
  await waitFor(() => expect(screen.queryByText('Cargando integración…')).not.toBeInTheDocument())
  const projectHeading = screen.getByRole('heading', { name: 'live-project' })
  const card = projectHeading.closest('a.project-card') as HTMLAnchorElement
  expect(card).toHaveAttribute('href', '/projects/p-1?workspaceId=ws-1')
  expect(within(card).getByText('Active PRs').closest('div')).toHaveTextContent('—')
  expect(within(card).getByText('Action Required').closest('div')).toHaveTextContent('0')
  expect(within(card).getByText('Actividad de análisis no disponible.')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar esta información')
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  expect(screen.queryByText('Sin análisis todavía')).not.toBeInTheDocument()
})

test('mantiene Runs como cargando si Action Required falla antes de que Runs termine', async () => {
  setDataSourceForTests('live')
  const workspace = { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }
  const project = { id: 'p-1', name: 'live-project', currentVersionId: null, workspace, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const projectsPage = { items: [project], nextCursor: null }
  const binding: ProjectRepositoryBindingResponse = {
    projectId: 'p-1', installationId: 'inst-1', repositoryId: 'repo-1', repositoryName: 'demo-user/live-project',
    integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  }
  const runsResponse = deferred<Response>()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input), 'http://core.test')
    if (url.pathname.endsWith('/workspaces')) return new Response(JSON.stringify({ items: [workspace] }), { status: 200 })
    if (url.pathname.endsWith('/analysis-runs')) return runsResponse.promise
    if (url.pathname.endsWith('/action-required')) {
      return new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Falló Action Required', correlationId: 'action-err' }), { status: 500 })
    }
    if (url.pathname.endsWith('/projects/p-1/integrations/github')) return new Response(JSON.stringify(binding), { status: 200 })
    return new Response(JSON.stringify(projectsPage), { status: 200 })
  })
  renderApp(<ProjectsPage />)

  await screen.findByRole('heading', { name: 'live-project' })
  await waitFor(() => expect(screen.queryByText('Cargando integración…')).not.toBeInTheDocument())
  const card = screen.getByRole('heading', { name: 'live-project' }).closest('a.project-card') as HTMLAnchorElement
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No pudimos cargar esta información')
  expect(within(card).getByText('Active PRs').closest('div')).toHaveTextContent('—')
  expect(within(card).getByText('Action Required').closest('div')).toHaveTextContent('—')
  expect(within(card).getByText('Cargando actividad de análisis…')).toBeInTheDocument()
  expect(screen.getByText('Cargando actividad y pendientes del workspace…')).toBeInTheDocument()
  expect(within(card).getByText('Cargando actividad de análisis…')).not.toHaveTextContent('no disponible')

  runsResponse.resolve(new Response(EMPTY_ACTION_REQUIRED_PAGE, { status: 200 }))
  expect(await screen.findByText(/Sin análisis todavía/)).toBeInTheDocument()
  expect(within(card).getByText('Action Required').closest('div')).toHaveTextContent('—')
})

test('ofrece "Cargar más" cuando el listado live trae nextCursor', async () => {
  setDataSourceForTests('live')
  const workspaces = { items: [{ kind: 'PERSONAL', id: 'ws-1', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }] }
  const firstPage = { items: [{ id: 'p-1', name: 'first-project', currentVersionId: null, workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }], nextCursor: 'p-1' }
  const secondPage = { items: [{ id: 'p-2', name: 'second-project', currentVersionId: null, workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }], nextCursor: null }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/workspaces')) return new Response(JSON.stringify(workspaces), { status: 200 })
    if (url.includes('/action-required') || url.includes('/analysis-runs')) return new Response(EMPTY_ACTION_REQUIRED_PAGE, { status: 200 })
    return new Response(JSON.stringify(url.includes('cursor=p-1') ? secondPage : firstPage), { status: 200 })
  })
  const user = userEvent.setup()
  renderApp(<ProjectsPage />)

  await waitFor(() => expect(screen.getByRole('heading', { name: 'first-project' })).toBeInTheDocument(), { timeout: 2000 })
  await user.click(screen.getByRole('button', { name: 'Cargar más' }))
  expect(await screen.findByRole('heading', { name: 'second-project' })).toBeInTheDocument()
})

test('el agregado de Projects recorre las páginas del workspace con el cursor opaco', async () => {
  setDataSourceForTests('live')
  const first = { id: 'p-1', name: 'one', currentVersionId: null, workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'dev' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const second = { ...first, id: 'p-2', name: 'two' }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    return new Response(JSON.stringify(String(input).includes('cursor=opaque') ? { items: [second], nextCursor: null } : { items: [first], nextCursor: 'opaque' }), { status: 200 })
  })
  await expect(listAllProjects('ws-1')).resolves.toEqual([first, second])
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(String(fetchMock.mock.calls[0][0])).toContain('limit=100')
  expect(String(fetchMock.mock.calls[1][0])).toContain('cursor=opaque')
})

test('presenta el escenario semilla en modo demo sin consultar la red', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<ProjectsPage />)
  expect(await screen.findByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.getByText('Control plane PR-driven')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('la franja de demo apunta al tour de Runs de SDD 3.0, no al flujo ZIP', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)
  await screen.findByText('Control plane PR-driven')
  expect(screen.getByRole('link', { name: /Explorar escenarios/ })).toHaveAttribute('href', '/analysis-runs?workspaceId=1000001')
  expect(screen.queryByText(/demostrar la carga ZIP/)).not.toBeInTheDocument()
})

test('HU25: filtra proyectos por nombre cuando hay más de cuatro', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  await createProject({ name: 'alpha-service' })
  await createProject({ name: 'beta-service' })
  await createProject({ name: 'gamma-service' })
  const user = userEvent.setup()

  renderApp(<ProjectsPage />)
  expect(await screen.findByText('alpha-service')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()

  await user.type(screen.getByLabelText('Buscar proyecto'), 'checkout')
  expect(screen.getByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.queryByText('alpha-service')).not.toBeInTheDocument()
  expect(screen.queryByText('beta-service')).not.toBeInTheDocument()
})

test('no ofrece buscador con pocos proyectos', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)
  expect(await screen.findByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Buscar proyecto')).not.toBeInTheDocument()
})

test('crea un proyecto con el contrato implementado, tras abrir el panel "Conectar repositorio"', async () => {
  const created = { id: 'p-1', name: 'checkout', currentVersionId: null, workspace: { kind: 'PERSONAL', id: '1000001', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-08-30', updatedAt: '2026-08-30' }
  const emptyPage = { items: [], nextCursor: null }
  const workspaces = { items: [{ kind: 'PERSONAL', id: '1000001', login: 'demo-user', avatarUrl: null, role: 'ADMIN' }] }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (init?.method === 'POST') return new Response(JSON.stringify(created), { status: 201 })
    if (String(input).includes('/workspaces')) return new Response(JSON.stringify(workspaces), { status: 200 })
    if (String(input).includes('/action-required') || String(input).includes('/analysis-runs')) return new Response(JSON.stringify(emptyPage), { status: 200 })
    return new Response(JSON.stringify(emptyPage), { status: 200 })
  })
  const user = userEvent.setup()
  renderApp(<ProjectsPage />)
  await screen.findByText('No hay Projects visibles en este workspace ahora.')
  await user.click(screen.getByRole('button', { name: '+ Conectar repositorio' }))
  await user.type(screen.getByLabelText('Nombre del proyecto'), ' checkout ')
  await user.click(screen.getByRole('button', { name: 'Crear proyecto' }))
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'checkout', workspaceId: '1000001' }) }))
})

test('KPIs reflejan el estado real del workspace demo (2 proyectos, 4 Action Required resaltado)', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)

  await screen.findByRole('heading', { name: 'checkout-service' })
  const projectsCard = screen.getByText('Proyectos', { selector: '.kpi-card span' }).closest('.kpi-card')
  expect(projectsCard).toHaveTextContent('2')

  const activePrCard = screen.getByText('PR activos', { selector: '.kpi-card span' }).closest('.kpi-card')
  expect(activePrCard).toHaveTextContent('13')

  const actionRequiredCard = screen.getByText('Action Required', { selector: '.kpi-card span' }).closest('.kpi-card')
  expect(actionRequiredCard).toHaveTextContent('4')
  expect(actionRequiredCard).toHaveClass('kpi-card-alert')

  const runsWeekCard = screen.getByText('Runs esta semana', { selector: '.kpi-card span' }).closest('.kpi-card')
  expect(runsWeekCard).not.toHaveTextContent('—')
})

test('"Requieren tu atención" lista PR#42 (checkout) y PR#17 (billing) con link a Focus Mode', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const { container } = renderApp(<ProjectsPage />)

  const heading = await screen.findByText('Requieren tu atención')
  const scope = within(heading.closest('.panel') as HTMLElement)
  expect(scope.getByText('PR #42', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(scope.getByText('PR #17', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(container.querySelector('a[href^="/action-required/arun_checkout_pr42?returnTo="]')).toBeInTheDocument()
})

test('la tarjeta de un proyecto conectado muestra binding, Active PRs, Action Required y la última corrida', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)

  await screen.findByRole('heading', { name: 'checkout-service' })
  // El binding tarda un tick en resolver; hasta entonces la tarjeta es un <div> placeholder que
  // luego se reemplaza por un <a> — hay que esperar a que asiente antes de fijar la referencia al nodo.
  await waitFor(() => expect(screen.queryAllByText('Cargando integración…')).toHaveLength(0))
  const heading = screen.getByRole('heading', { name: 'checkout-service' })
  const checkoutCard = heading.closest('.project-card') as HTMLElement
  const scope = within(checkoutCard)
  expect(scope.getByText('CONNECTED')).toBeInTheDocument()
  expect(scope.getByText('develop')).toBeInTheDocument()
  expect(scope.getByText('Active PRs').closest('div')).toHaveTextContent('7')
  expect(scope.getByText('Action Required').closest('div')).toHaveTextContent('2')
  expect(scope.getByText(/PR #50/, { selector: 'p' })).toBeInTheDocument()
})

test('un proyecto sin binding muestra NOT CONNECTED y enlaza a integrations/github', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const project = await mockCreateProject({ name: 'sin-binding' })
  renderApp(<ProjectsPage />)

  const badge = await screen.findByText('NOT CONNECTED')
  const link = badge.closest('a')
  expect(link).toHaveAttribute('href', `/projects/${project.id}/integrations/github?workspaceId=1000001`)
  expect(within(link as HTMLElement).getByRole('heading', { name: 'sin-binding' })).toBeInTheDocument()
})

test('un proyecto desconectado (DISABLED tras Desconectar) sigue visible como Pausado y no como NOT CONNECTED', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  await disconnectRepository('prj_checkout_demo')
  renderApp(<ProjectsPage />)

  const badge = await screen.findByText('Pausado')
  expect(badge.closest('a')).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github?workspaceId=1000001')
  expect(within(badge.closest('a') as HTMLElement).getByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.queryByText('NOT CONNECTED')).not.toBeInTheDocument()
})

test('un proyecto eliminado deja de aparecer en la lista', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  await deleteProject('prj_checkout_demo')
  renderApp(<ProjectsPage />)

  expect(await screen.findByRole('heading', { name: 'billing-engine' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'checkout-service' })).not.toBeInTheDocument()
})

test('"Actividad reciente" enlaza cada Run a su Analysis Run Detail', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const { container } = renderApp(<ProjectsPage />)

  const heading = await screen.findByText('Actividad reciente')
  expect(container.querySelector('a[href="/projects/prj_checkout_demo/runs/arun_checkout_pr42?workspaceId=1000001"]')).toBeInTheDocument()
  const section = heading.closest('.panel') as HTMLElement
  expect(within(section).getByRole('link', { name: /Ver todos/ })).toHaveAttribute('href', '/analysis-runs?workspaceId=1000001')
})

function renderCardWithBinding(project: Project, binding: ProjectRepositoryBindingResponse) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(controlPlaneKeys.binding(project.id), binding)
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProjectOverviewCard project={project} runsForProject={[]} actionRequiredCount={0} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderCardForStatus(status: ProjectRepositoryBindingResponse['status']) {
  const project: Project = { id: 'prj_x', name: 'revoked-service', currentVersionId: null, workspace: { kind: 'ORGANIZATION', id: '2000001', login: 'acme' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const binding: ProjectRepositoryBindingResponse = {
    projectId: 'prj_x', installationId: 'inst_x', repositoryId: 'repo_x', repositoryName: 'acme/revoked-service',
    integrationBranch: 'develop', status, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  }
  return renderCardWithBinding(project, binding)
}

test('Pausado: un binding DISABLED muestra el aviso de pausa y enlaza a revisar la integración', () => {
  renderCardForStatus('DISABLED')

  expect(screen.getByText('Pausado')).toBeInTheDocument()
  expect(screen.getByText(/pausado. No se procesarán nuevos Pull Requests hasta reactivarlo/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Revisar integración/ })).toHaveAttribute('href', '/projects/prj_x/integrations/github?workspaceId=2000001')
})

test('Revocado: un binding REVOKED se distingue de Pausado y explica la pérdida de acceso de la App', () => {
  renderCardForStatus('REVOKED')

  expect(screen.getByText('Revocado')).toHaveClass('status-danger')
  expect(screen.queryByText('Pausado')).not.toBeInTheDocument()
  expect(screen.getByText(/La GitHub App perdió acceso al repositorio/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Revisar integración/ })).toHaveAttribute('href', '/projects/prj_x/integrations/github?workspaceId=2000001')
})

function LocationStateProbe() {
  const location = useLocation()
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>
}

test('el aviso «Proyecto eliminado» llega por el state de navegación, se anuncia con role="status", mueve el foco al h1 y no persiste', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[{ pathname: '/', state: { deletedProjectName: 'demo-eliminado' } }]}>
        <ProjectsPage />
        <LocationStateProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  const notice = await screen.findByText('Proyecto «demo-eliminado» eliminado')
  expect(notice).toHaveAttribute('role', 'status')
  expect(screen.getByRole('heading', { name: 'Proyectos', level: 1 })).toHaveFocus()
  // El state se limpia (history.state sobrevive a una recarga): el aviso no se repite al volver a montar la lista.
  await waitFor(() => expect(screen.getByTestId('location-state')).toHaveTextContent('null'))
})

test('sin state de navegación no aparece ningún aviso de eliminación', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)

  await screen.findByRole('heading', { name: 'billing-engine' })
  expect(screen.queryByText(/eliminado/)).not.toBeInTheDocument()
})
