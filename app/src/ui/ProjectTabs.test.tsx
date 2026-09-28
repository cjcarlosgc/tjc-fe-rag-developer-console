import { afterEach, beforeEach, expect, test } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { ProjectTabs } from './ProjectTabs'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})
afterEach(() => setDataSourceForTests(null))

test('resalta el tab activo según la ruta actual', async () => {
  renderApp(<ProjectTabs projectId="prj_checkout_demo" />, { initialEntry: '/projects/prj_checkout_demo/functional-knowledge' })
  const nav = await screen.findByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Functional Knowledge' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  await waitFor(() => expect(within(nav).getByRole('link', { name: 'Runs' })).toHaveAttribute('href', '/analysis-runs?projectId=prj_checkout_demo&workspaceId=1000001'))
  expect(within(nav).getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/projects/prj_checkout_demo/analyses?workspaceId=1000001')
})

test('el tab "Runs" queda activo cuando la URL trae ?projectId= de este proyecto', async () => {
  renderApp(<ProjectTabs projectId="prj_checkout_demo" />, { initialEntry: '/analysis-runs?projectId=prj_checkout_demo' })
  const nav = await screen.findByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page')
})

test('el tab "Historial" lleva a los snapshots del proyecto y queda activo en /analyses', async () => {
  renderApp(<ProjectTabs projectId="prj_checkout_demo" />, { initialEntry: '/projects/prj_checkout_demo/analyses', routePath: '/projects/:projectId/analyses' })
  const nav = await screen.findByRole('navigation', { name: 'Secciones del proyecto' })
  await waitFor(() => expect(within(nav).getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/projects/prj_checkout_demo/analyses?workspaceId=1000001'))
  expect(within(nav).getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page')
})
