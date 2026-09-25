import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { AnalysisHistoryPage } from './AnalysisHistoryPage'

test('muestra los tres snapshots conservados y distingue el actual sin sugerir upload manual', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<AnalysisHistoryPage />, { initialEntry: '/projects/prj_checkout_demo/analyses', routePath: '/projects/:projectId/analyses' })

  expect(await screen.findAllByRole('heading', { name: 'Snapshot de repositorio', level: 2 })).toHaveLength(3)
  expect(screen.queryByText(/\.zip|cargar versión|indexar nueva versión/i)).not.toBeInTheDocument()
  expect(screen.getByText('VERSIÓN ACTUAL')).toBeInTheDocument()
  expect(screen.getByText('3', { selector: '.history-heading-meta > strong' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /Ver inventario/ })).toHaveLength(3)
  expect(screen.getAllByRole('link', { name: /Ver inventario/ })[0].getAttribute('href')).toContain('/versions/ver_checkout_7/inventory')
  expect(fetchMock).not.toHaveBeenCalled()
})
