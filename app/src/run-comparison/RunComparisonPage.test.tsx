import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { RunComparisonPage } from './RunComparisonPage'

test('HU48: arranca la comparación al montar y presenta el resultado tras varios polls', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr45/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

  expect(await screen.findByText('Laboratorio simulado')).toBeInTheDocument()
  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
})

test('HU48: un Run ACTION_REQUIRED no puede compararse', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr42/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

  expect(await screen.findByRole('alert')).toHaveTextContent(/contexto funcional/)
})

test('HU48: un Run sin símbolo METHOD/FUNCTION elegible no ofrece comparación', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_billing_demo/runs/arun_billing_pr22/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

  expect(await screen.findByText(/Ning[uú]n símbolo de este Run/)).toBeInTheDocument()
})

test('HU48: con más de un símbolo elegible, muestra el selector y no arranca sola', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr49/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

  const select = await screen.findByLabelText('Símbolo') as HTMLSelectElement
  expect(Array.from(select.options).map((option) => option.value)).toEqual(['OrderService.calculateTotal', 'OrderService.createOrder', 'formatCurrency'])
  expect(screen.getByRole('button', { name: 'Iniciar comparación' })).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('HU48 (Replay): permite elegir símbolo, iniciar y repetir la comparación sobre el mismo Run', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const user = userEvent.setup()
  renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr49/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

  const select = await screen.findByLabelText('Símbolo') as HTMLSelectElement
  await user.selectOptions(select, 'OrderService.createOrder')
  await user.click(screen.getByRole('button', { name: 'Iniciar comparación' }))

  expect(await screen.findByText('OrderService.createOrder')).toBeInTheDocument()
  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Repetir comparación (Replay)' }))

  await waitFor(() => expect(screen.getAllByRole('heading', { level: 3, name: 'OrderService.createOrder' })).toHaveLength(2))
  await waitFor(() => expect(screen.getAllByText('Huella de retrieval')).toHaveLength(2), { timeout: 2000 })
})
