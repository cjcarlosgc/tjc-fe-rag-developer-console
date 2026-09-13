import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { IntegrationsPage } from './IntegrationsPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderIntegrations(projectId: string) {
  return renderApp(<IntegrationsPage />, { initialEntry: `/projects/${projectId}/integrations/github`, routePath: '/projects/:projectId/integrations/github' })
}

test('HU30: muestra el binding ENABLED y permite desconectar', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_checkout_demo')

  expect(await screen.findByText('acme/checkout-service')).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Desconectar' }))

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
})

test('HU30: sin binding, el flujo de 2 pasos reconecta el repositorio', async () => {
  const user = userEvent.setup()
  renderIntegrations('prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }))
  await screen.findByText('Sin repositorio vinculado')

  await user.click(screen.getByRole('button', { name: 'Conectar GitHub App' }))
  expect(await screen.findByText('Instalación simulada iniciada')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Simular instalación completada' }))
  expect(await screen.findByText('acme/billing-engine')).toBeInTheDocument()
  expect(screen.getByText('ENABLED')).toBeInTheDocument()
})
