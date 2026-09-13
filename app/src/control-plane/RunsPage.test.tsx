import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { RunsPage } from './RunsPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

test('HU32: lista los 9 Analysis Runs con su badge de estado', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs' })

  expect(await screen.findByText('acme/checkout-service · PR #42')).toBeInTheDocument()
  expect(screen.getAllByText('Success')).toHaveLength(2)
  expect(screen.getByText('Behavioral mismatch')).toBeInTheDocument()
  expect(screen.getByText('Obsolete (HEAD nuevo)')).toBeInTheDocument()
  expect(screen.getByText('NO VIGENTE')).toBeInTheDocument()
  expect(screen.getAllByText(/acme\/(checkout-service|billing-engine)/)).toHaveLength(9)
})

test('HU32: filtra por proyecto vía ?projectId=', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_billing_demo' })

  expect(await screen.findByText('acme/billing-engine · PR #20')).toBeInTheDocument()
  expect(screen.queryByText('acme/checkout-service · PR #42')).not.toBeInTheDocument()
})
