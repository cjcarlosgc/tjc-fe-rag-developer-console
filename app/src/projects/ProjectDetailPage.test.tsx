import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { disconnectRepository } from '../control-plane/api'
import { renderApp } from '../test/render'
import { ProjectDetailPage } from './ProjectDetailPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderDetail(projectId: string) {
  return renderApp(<ProjectDetailPage />, { initialEntry: `/projects/${projectId}`, routePath: '/projects/:projectId' })
}

test('HU30: un proyecto vinculado muestra el binding', async () => {
  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('develop')).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()
})

test('la sub-nav del proyecto (ProjectTabs) enlaza a Runs/Functional Knowledge/Integrations, con Overview activo', async () => {
  renderDetail('prj_checkout_demo')

  const nav = await screen.findByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Runs' })).toHaveAttribute('href', '/analysis-runs?projectId=prj_checkout_demo')
  expect(within(nav).getByRole('link', { name: 'Functional Knowledge' })).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge')
  expect(within(nav).getByRole('link', { name: 'Integrations' })).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github')
})

test('HU19: "Modo experimental" es visible como capacidad propia, no legacy', async () => {
  renderDetail('prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.getByRole('link', { name: /Modo experimental/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/experimental')
})

test('el flujo ZIP no aparece en la página principal ni su link a herramientas legacy (oculto a pedido del usuario; la ruta sigue existiendo)', async () => {
  renderDetail('prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.queryByText('Cargar código fuente')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Configurar generación' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Herramientas legacy/ })).not.toBeInTheDocument()
})

test('HU30: un proyecto sin binding ofrece conectar GitHub', async () => {
  await disconnectRepository('prj_checkout_demo')

  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Conectar GitHub/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github')
})
