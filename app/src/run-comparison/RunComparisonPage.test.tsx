import { screen } from '@testing-library/react'
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
