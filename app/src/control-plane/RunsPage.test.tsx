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

test('un workspaceId no permite ver Runs de un Project perteneciente a otro workspace', async () => {
  renderApp(<RunsPage />, { initialEntry: '/analysis-runs?projectId=prj_org_metrics_demo&workspaceId=1000001' })

  expect(await screen.findByText('Project fuera del workspace seleccionado')).toBeInTheDocument()
  expect(screen.queryByText('PR #15', { selector: '.pr-ref' })).not.toBeInTheDocument()
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})
