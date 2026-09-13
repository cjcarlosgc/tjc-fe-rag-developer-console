import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { LegacyToolsPage } from './LegacyToolsPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

test('conserva el flujo ZIP completo (versión actual, upload, enlaces de generación/experimento/análisis)', async () => {
  renderApp(<LegacyToolsPage />, { initialEntry: '/projects/prj_checkout_demo/legacy', routePath: '/projects/:projectId/legacy' })

  expect(await screen.findByText('Herramientas ZIP de checkout-service')).toBeInTheDocument()
  expect(screen.getByText('LEGACY · DESARROLLO')).toBeInTheDocument()
  expect(screen.getByText('ver_checkout_7')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Modo experimental' })).toHaveAttribute('href', '/projects/prj_checkout_demo/experimental')
  expect(screen.getByRole('link', { name: /Historial de análisis/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/analyses')
  expect(screen.getByRole('link', { name: /Historial de generaciones/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/runs')
  expect(screen.getByRole('link', { name: /Configurar generación/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/generate')
  expect(screen.getByText('Cargar código fuente')).toBeInTheDocument()
})
