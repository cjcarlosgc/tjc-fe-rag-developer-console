import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { GenerationPage } from './GenerationPage'

test('resuelve el target seleccionado y conserva el bloqueo contractual en live', async () => {
  const project = { id: 'p-1', name: 'math', currentVersionId: 'v-1', createdAt: '2026-08-31T10:00:00.000Z', updatedAt: '2026-08-31T10:01:00.000Z' }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [{ id: 'function-1', filePath: 'src/math.ts', symbolName: 'sum', methodName: null, targetType: 'FUNCTION', hasTest: false, testFilePaths: [] }],
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
  const user = userEvent.setup()

  renderApp(<GenerationPage />, { initialEntry: '/projects/p-1/generate?targetId=function-1', routePath: '/projects/:projectId/generate' })

  const targetMode = await screen.findByRole('radio', { name: /Target puntual/ })
  expect(targetMode).toBeEnabled()
  await user.click(targetMode)
  await user.click(screen.getByRole('button', { name: 'Confirmar configuración' }))
  expect(await screen.findByText('No se pudo crear el run')).toBeInTheDocument()
  expect(screen.getByText(/VITE_DATA_SOURCE=mock/)).toBeInTheDocument()
})
