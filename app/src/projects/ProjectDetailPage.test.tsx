import { screen } from '@testing-library/react'
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

test('HU30: un proyecto vinculado muestra el binding y enlaces a Runs/Integrations', async () => {
  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('acme/checkout-service')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver Runs de este proyecto/ })).toHaveAttribute('href', '/analysis-runs?projectId=prj_checkout_demo')
  expect(screen.getByRole('link', { name: /Gestionar integración/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github')
})

test('el flujo ZIP no aparece en la página principal: solo un link discreto a herramientas legacy', async () => {
  renderDetail('prj_checkout_demo')

  await screen.findByText('acme/checkout-service')
  expect(screen.queryByText('Cargar código fuente')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Configurar generación' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Herramientas legacy/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/legacy')
})

test('HU30: un proyecto sin binding ofrece conectar GitHub', async () => {
  await disconnectRepository('prj_checkout_demo')

  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Conectar GitHub/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github')
})
