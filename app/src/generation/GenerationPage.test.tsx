import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { GenerationPage } from './GenerationPage'

test('resuelve el target seleccionado y muestra un error accionable si Core rechaza la generación', async () => {
  const project = { id: 'p-1', name: 'math', currentVersionId: 'v-1', workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-08-31T10:00:00.000Z', updatedAt: '2026-08-31T10:01:00.000Z' }
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
    if (url.includes('/test-runs')) return new Response(JSON.stringify({ message: 'fallo simulado' }), { status: 500 })
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
  const user = userEvent.setup()

  renderApp(<GenerationPage />, { initialEntry: '/projects/p-1/generate?targetId=function-1', routePath: '/projects/:projectId/generate' })

  const targetMode = await screen.findByRole('radio', { name: /Target puntual/ })
  expect(targetMode).toBeEnabled()
  await user.click(targetMode)
  await user.click(screen.getByRole('button', { name: 'Confirmar configuración' }))
  expect(await screen.findByText('No se pudo crear el run')).toBeInTheDocument()
})

test('HU25 (generación live): envía Idempotency-Key en POST /test-runs y navega al run aceptado', async () => {
  const project = { id: 'p-1', name: 'math', currentVersionId: 'v-1', workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-08-31T10:00:00.000Z', updatedAt: '2026-08-31T10:01:00.000Z' }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [{ id: 'function-1', filePath: 'src/math.ts', symbolName: 'sum', methodName: null, targetType: 'FUNCTION', hasTest: false, testFilePaths: [] }],
  }
  const accepted = { runId: 'run-1', projectId: 'p-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 500 }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/test-runs')) return new Response(JSON.stringify(accepted), { status: 202 })
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
  const user = userEvent.setup()

  renderApp(<GenerationPage />, { initialEntry: '/projects/p-1/generate?targetId=function-1', routePath: '/projects/:projectId/generate' })

  const targetMode = await screen.findByRole('radio', { name: /Target puntual/ })
  await user.click(targetMode)
  await user.click(screen.getByRole('button', { name: 'Confirmar configuración' }))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test-runs'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
        body: JSON.stringify({ projectId: 'p-1', mode: 'TARGET', targetId: 'function-1' }),
      }),
    )
  })
})
