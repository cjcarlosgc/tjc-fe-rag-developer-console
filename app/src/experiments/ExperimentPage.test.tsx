import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { ExperimentPage } from './ExperimentPage'

test('ejecuta y presenta una comparación simulada sin red', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByRole('heading', { name: 'RAG vs Agente generalista', level: 1 })).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('Laboratorio simulado')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('HU19 (live): envía el target real, sondea y presenta el resultado real', async () => {
  const project = { id: 'p-1', name: 'checkout', currentVersionId: 'v-1', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [{ id: 'target-1', filePath: 'src/math.ts', symbolName: 'sum', methodName: null, targetType: 'FUNCTION', hasTest: false, testFilePaths: [] }],
  }
  const accepted = { experimentId: 'exp-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 10 }
  const status = { id: 'exp-1', projectId: 'p-1', projectVersionId: 'v-1', targetId: 'target-1', status: 'COMPLETED', completedRepetitions: 6, totalRepetitions: 6, failureCode: null, failureMessage: null, startedAt: '2026-09-07T00:00:00.000Z', completedAt: '2026-09-07T00:05:00.000Z' }
  const results = {
    experimentId: 'exp-1', projectVersionId: 'v-1', targetId: 'target-1', repetitionsPerStrategy: 3, completedAt: '2026-09-07T00:05:00.000Z',
    strategies: [
      { strategy: 'RAG', validRate: .83, compilationRate: 1, executionRate: .83, passedRate: .83, generationDurationMs: 900, executionDurationMs: 200, totalDurationMs: 1100, inputTokens: 500, outputTokens: 200, totalTokens: 700, estimatedCost: .02, retrievedChunks: 10, selectedChunks: 4, contextTokens: 900, toolCalls: null, filesInspected: null, failures: {} },
      { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .67, executionRate: .5, passedRate: .5, generationDurationMs: 1200, executionDurationMs: 300, totalDurationMs: 1500, inputTokens: 800, outputTokens: 300, totalTokens: 1100, estimatedCost: .03, retrievedChunks: null, selectedChunks: null, contextTokens: null, toolCalls: 5, filesInspected: 3, failures: {} },
    ],
    repetitions: [{ repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: 230 }],
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.includes('/experiments/exp-1/results')) return new Response(JSON.stringify(results), { status: 200 })
    if (url.includes('/experiments/exp-1')) return new Response(JSON.stringify(status), { status: 200 })
    if (url.includes('/experiments') && init?.method === 'POST') return new Response(JSON.stringify(accepted), { status: 202 })
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
  const user = userEvent.setup()

  renderApp(<ExperimentPage />, { initialEntry: '/projects/p-1/experimental', routePath: '/projects/:projectId/experimental' })

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de exploración', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/experiments'),
    expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }), body: JSON.stringify({ projectId: 'p-1', targetId: 'target-1' }) }),
  )
})
