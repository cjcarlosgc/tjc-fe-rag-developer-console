import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { RunPage } from './RunPage'

test('HU24: reintenta un target inválido desde la página del run y termina en válido', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const user = userEvent.setup()

  renderApp(<RunPage />, { initialEntry: '/projects/prj_checkout_demo/legacy/runs/run_checkout_seed', routePath: '/projects/:projectId/legacy/runs/:runId' })

  const retryButton = await screen.findByRole('button', { name: 'Reintentar' })
  await user.click(retryButton)

  expect(await screen.findByText('Ejecución completada', {}, { timeout: 3000 })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  expect(screen.queryByText('No se pudo reintentar el target')).not.toBeInTheDocument()
})
