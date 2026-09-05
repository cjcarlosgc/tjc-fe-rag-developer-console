import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { AnalysisHistoryPage } from './AnalysisHistoryPage'

test('muestra tres versiones indexadas y distingue la actual', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<AnalysisHistoryPage />, { initialEntry: '/projects/prj_checkout_demo/analyses', routePath: '/projects/:projectId/analyses' })

  expect(await screen.findByText('checkout-service-v7.zip')).toBeInTheDocument()
  expect(screen.getByText('checkout-service-v6.zip')).toBeInTheDocument()
  expect(screen.getByText('checkout-service-v5.zip')).toBeInTheDocument()
  expect(screen.getByText('VERSIÓN ACTUAL')).toBeInTheDocument()
  expect(screen.getByText('3', { selector: '.history-heading-meta > strong' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /Ver inventario/ })).toHaveLength(3)
  expect(screen.getAllByRole('link', { name: /Ver inventario/ })[0].getAttribute('href')).toContain('/versions/ver_checkout_7/inventory')
  expect(fetchMock).not.toHaveBeenCalled()
})
