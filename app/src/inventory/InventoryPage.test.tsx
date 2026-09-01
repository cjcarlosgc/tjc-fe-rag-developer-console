import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { InventoryPage } from './InventoryPage'

test('carga el inventario de la ProjectVersion actual y mapea su contrato', async () => {
  const project = { id: 'p-1', name: 'checkout', currentVersionId: 'v-1', createdAt: '2026-08-31T10:00:00.000Z', updatedAt: '2026-08-31T10:01:00.000Z' }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 2,
    targetsWithTest: 1,
    targetsMissingTest: 1,
    targets: [
      { id: 't-1', filePath: 'src/cart.ts', symbolName: 'Cart', methodName: null, targetType: 'CLASS', hasTest: true, testFilePaths: ['src/cart.spec.ts'] },
      { id: 't-2', filePath: 'src/cart.ts', symbolName: 'Cart', methodName: 'total', targetType: 'METHOD', hasTest: false, testFilePaths: [] },
    ],
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })

  renderApp(<InventoryPage />, { initialEntry: '/projects/p-1/inventory', routePath: '/projects/:projectId/inventory' })

  expect(await screen.findByText('Resumen de cobertura')).toBeInTheDocument()
  expect(screen.getByText('VITEST')).toBeInTheDocument()
  expect(screen.getByText('total')).toBeInTheDocument()
  expect(screen.getAllByText('Sin test').length).toBeGreaterThan(0)
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/project-versions/v-1/test-inventory'), expect.any(Object))
})

test('no consulta inventario cuando el proyecto no tiene versión actual', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'p-1', name: 'empty', currentVersionId: null, createdAt: '2026-08-31', updatedAt: '2026-08-31' }), { status: 200 }))

  renderApp(<InventoryPage />, { initialEntry: '/projects/p-1/inventory', routePath: '/projects/:projectId/inventory' })

  expect(await screen.findByText('Este proyecto todavía no tiene una versión lista')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
