import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { RunsPage } from './RunsPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

test('HU32: lista todos los Analysis Runs con su badge de estado', async () => {
  const { container } = renderApp(<RunsPage />, { initialEntry: '/analysis-runs' })

  expect(await screen.findByText('PR #42', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getAllByText('checkout-service').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Success')).toHaveLength(6)
  expect(screen.getByText('Behavioral mismatch')).toBeInTheDocument()
  expect(screen.getByText('Obsolete (HEAD nuevo)')).toBeInTheDocument()
  expect(screen.getByText('NO VIGENTE')).toBeInTheDocument()
  expect(container.querySelectorAll('.repo-chip')).toHaveLength(16)
})

test('el workspace personal no mezcla Runs de las organizaciones', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?workspaceId=1000001' })
  expect(await screen.findByText('PR #42', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.queryByText('PR #15', { selector: '.pr-ref' })).not.toBeInTheDocument()
})

test('el workspace de organización muestra únicamente sus Runs', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?workspaceId=2000002' })
  expect(await screen.findByText('PR #15', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})

test('HU32: filtra por proyecto vía ?projectId=', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_billing_demo' })

  expect(await screen.findByText('PR #20', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getAllByText('billing-engine').length).toBeGreaterThan(0)
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})

test('live: el listado por proyecto muestra solo los Runs devueltos por Core', async () => {
  setDataSourceForTests('live')
  const returnedRun = {
    id: 'arun_visible_pr71', projectId: 'prj_checkout_demo',
    pullRequest: { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', number: 71, title: 'Run visible', baseRef: 'develop', headRef: 'feature/visible', baseSha: 'base-71', headSha: 'head-71', draft: false, state: 'OPEN', actorLogin: null },
    status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
    createdAt: '2026-09-27T10:00:00.000Z', updatedAt: '2026-09-27T10:01:00.000Z', completedAt: '2026-09-27T10:01:00.000Z',
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const pathname = new URL(String(input)).pathname
    if (pathname === '/projects/prj_checkout_demo') {
      return new Response(JSON.stringify({ id: 'prj_checkout_demo', name: 'checkout', currentVersionId: null, workspace: { kind: 'PERSONAL', id: 'user-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-27T10:00:00.000Z', updatedAt: '2026-09-27T10:00:00.000Z' }), { status: 200 })
    }
    if (pathname.startsWith('/projects/prj_checkout_demo/analysis-runs')) {
      return new Response(JSON.stringify({ items: [returnedRun], nextCursor: null }), { status: 200 })
    }
    throw new Error(`Solicitud inesperada en la prueba: ${pathname}`)
  })

  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_checkout_demo' })

  expect(await screen.findByText('PR #71', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.queryByText('PR #70', { selector: '.pr-ref' })).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/prj_checkout_demo\/analysis-runs/), expect.anything())
  expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/^\/analysis-runs(?:\?|$)/), expect.anything())
})

test('un workspaceId no permite ver Runs de un Project perteneciente a otro workspace', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_org_metrics_demo&workspaceId=1000001' })

  expect(await screen.findByText('Project fuera del workspace seleccionado')).toBeInTheDocument()
  expect(screen.queryByText('PR #15', { selector: '.pr-ref' })).not.toBeInTheDocument()
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})
