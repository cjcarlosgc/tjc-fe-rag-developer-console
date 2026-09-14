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

test('HU32: lista los 14 Analysis Runs con su badge de estado', async () => {
  const { container } = renderApp(<RunsPage />, { initialEntry: '/analysis-runs' })

  expect(await screen.findByText('PR #42', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getAllByText('checkout-service').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Success')).toHaveLength(5)
  expect(screen.getByText('Behavioral mismatch')).toBeInTheDocument()
  expect(screen.getByText('Obsolete (HEAD nuevo)')).toBeInTheDocument()
  expect(screen.getByText('NO VIGENTE')).toBeInTheDocument()
  expect(container.querySelectorAll('.repo-chip')).toHaveLength(14)
})

test('HU32: filtra por proyecto vía ?projectId=', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_billing_demo' })

  expect(await screen.findByText('PR #20', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getAllByText('billing-engine').length).toBeGreaterThan(0)
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})
