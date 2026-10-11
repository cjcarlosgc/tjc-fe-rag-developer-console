import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { getCaptureNextPrState } from '../run-comparison/speculative/captureNextPr'
import { ExperimentPage } from './ExperimentPage'
import { EXPERIMENT_CONDITIONS_NOTE } from './ExperimentConditionsNote'

// Control de la creación: `error` falla una sola llamada; `targetOverride` cambia el target real por un escenario DEMO.
// Sin estas marcas la llamada pasa al mock real sin cambios.
const startHarness = vi.hoisted(() => ({ calls: 0, targetOverride: null as string | null, error: null as unknown }))

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    startExperiment: (input: { analysisRunId: string; symbolFilePath: string; symbolQualifiedName: string }, idempotencyKey: string) => {
      startHarness.calls += 1
      if (startHarness.error) {
        const error = startHarness.error
        startHarness.error = null
        return Promise.reject(error)
      }
      return actual.startExperiment({ ...input, symbolQualifiedName: startHarness.targetOverride ?? input.symbolQualifiedName }, idempotencyKey)
    },
  }
})

beforeEach(() => {
  resetMockBackend()
  startHarness.calls = 0
  startHarness.targetOverride = null
  startHarness.error = null
})

test('ejecuta y presenta una comparación simulada sin red', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const user = userEvent.setup()
  const { container } = renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByRole('heading', { name: 'RAG vs Agente generalista', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(EXPERIMENT_CONDITIONS_NOTE)).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('Laboratorio simulado')).toBeInTheDocument()
  expect(container.textContent).not.toMatch(/precision|recall/i)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('HU49 (propuesta): arma, simula la llegada del PR y navega a la comparación, quedando OFF de nuevo', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByText('Capture next PR')).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))
  expect(await screen.findByText('Esperando el próximo PR elegible…')).toBeInTheDocument()

  await user.click(await screen.findByRole('button', { name: 'Simular llegada del PR (demo)' }))

  await waitFor(async () => {
    await expect(getCaptureNextPrState('prj_checkout_demo')).resolves.toMatchObject({ status: 'OFF' })
  })
  expect(screen.queryByRole('heading', { name: 'RAG vs Agente generalista', level: 1 })).not.toBeInTheDocument()
})

test('HU49 (propuesta): cancelar vuelve al estado inicial sin capturar nada', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))
  expect(await screen.findByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))

  expect(await screen.findByRole('button', { name: 'Armar captura' })).toBeInTheDocument()
})

test('HU19 (live): envía el target real, sondea y presenta el resultado real', async () => {
  const project = { id: 'p-1', name: 'checkout', currentVersionId: 'v-1', workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [{ id: 'target-1', filePath: 'src/math.ts', symbolName: 'sum', methodName: null, targetType: 'FUNCTION', hasTest: false, testFilePaths: [] }],
  }
  const symbol = { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'sum', filePath: 'src/math.ts', changeKind: 'DIRECTLY_CHANGED' }
  const run = { id: 'arun-1', projectId: 'p-1', pullRequest: { number: 1 }, symbols: [symbol] }
  const accepted = { analysisRunId: 'arun-1', experimentId: 'exp-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 10 }
  const status = { id: 'exp-1', analysisRunId: 'arun-1', projectId: 'p-1', projectVersionId: 'v-1', symbol, status: 'COMPLETED', completedRepetitions: 6, totalRepetitions: 6, failureCode: null, failureMessage: null, startedAt: '2026-09-07T00:00:00.000Z', completedAt: '2026-09-07T00:05:00.000Z' }
  const results = {
    experimentId: 'exp-1', analysisRunId: 'arun-1', projectVersionId: 'v-1', symbol, repetitionsPerStrategy: 3, completedAt: '2026-09-07T00:05:00.000Z',
    strategies: [
      { strategy: 'RAG', validRate: .83, compilationRate: 1, executionRate: .83, passedRate: .83, generationDurationMs: 900, executionDurationMs: 200, totalDurationMs: 1100, inputTokens: 500, outputTokens: 200, totalTokens: 700, estimatedCost: .02, retrievedChunks: 10, selectedChunks: 4, contextTokens: 900, toolCalls: null, filesInspected: null, failures: {} },
      { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .67, executionRate: .5, passedRate: .5, generationDurationMs: 1200, executionDurationMs: 300, totalDurationMs: 1500, inputTokens: 800, outputTokens: 300, totalTokens: 1100, estimatedCost: .03, retrievedChunks: null, selectedChunks: null, contextTokens: null, toolCalls: 5, filesInspected: 3, failures: {} },
    ],
    repetitions: [{ repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: 230, errorSummary: null }],
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.includes('/experiments/exp-1/results')) return new Response(JSON.stringify(results), { status: 200 })
    if (url.includes('/experiments/exp-1')) return new Response(JSON.stringify(status), { status: 200 })
    if (url.includes('/experiments') && init?.method === 'POST') return new Response(JSON.stringify(accepted), { status: 202 })
    if (url.includes('/analysis-runs/arun-1')) return new Response(JSON.stringify(run), { status: 200 })
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
  const user = userEvent.setup()

  renderApp(<ExperimentPage />, { initialEntry: '/projects/p-1/experimental?analysisRunId=arun-1', routePath: '/projects/:projectId/experimental' })

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de exploración', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/experiments'),
    expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }), body: JSON.stringify({ analysisRunId: 'arun-1', symbolFilePath: 'src/math.ts', symbolQualifiedName: 'sum' }) }),
  )
})

test('live sin analysisRunId explica cómo llegar a un Run elegible y no muestra un selector vacío', async () => {
  setDataSourceForTests('live')
  const project = { id: 'p-1', name: 'checkout', currentVersionId: 'v-1', workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => new Response(JSON.stringify(String(input).includes('/test-inventory')
    ? { projectVersionId: 'v-1', detectedFramework: 'VITEST', targetsTotal: 0, targetsWithTest: 0, targetsMissingTest: 0, targets: [] }
    : project), { status: 200 }))

  renderApp(<ExperimentPage />, { initialEntry: '/projects/p-1/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByText(/Abre esta comparación desde un Analysis Run vigente/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Target experimental')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).not.toBeInTheDocument()
})

test('live sin símbolo elegible explica el criterio y no muestra un selector vacío', async () => {
  setDataSourceForTests('live')
  const project = { id: 'p-1', name: 'checkout', currentVersionId: 'v-1', workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' }, role: 'ADMIN', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
  const run = { id: 'arun-no-target', projectId: 'p-1', status: 'SUCCESS', symbols: [
    { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'MathService', filePath: 'src/math.ts', changeKind: 'DIRECTLY_CHANGED' },
    { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'format', filePath: 'src/format.ts', changeKind: 'POTENTIALLY_AFFECTED' },
  ] }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    const value = url.includes('/analysis-runs/arun-no-target') ? run : url.includes('/test-inventory')
      ? { projectVersionId: 'v-1', detectedFramework: 'VITEST', targetsTotal: 0, targetsWithTest: 0, targetsMissingTest: 0, targets: [] }
      : project
    return new Response(JSON.stringify(value), { status: 200 })
  })

  renderApp(<ExperimentPage />, { initialEntry: '/projects/p-1/experimental?analysisRunId=arun-no-target', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByText(/no tiene un símbolo METHOD o FUNCTION con cambio DIRECTLY_CHANGED/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Target experimental')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).not.toBeInTheDocument()
})

test('WI-CONSOLE-017: la descarga de evidencia no aparece mientras el experimento corre y sí al completarse', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  expect(screen.queryByRole('button', { name: 'Descargar evidencia (JSON)' })).not.toBeInTheDocument()

  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Descargar evidencia (JSON)' })).toBeInTheDocument()
})

test('FAILED visible: role alert con el copy de EXPERIMENT_WORKER_LOST, sin «Preparando experimento» y con el detalle y el rótulo DEMO', async () => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = 'demo-scenario-failed-worker-lost'
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText('El experimento no se completó')).toBeInTheDocument()
  expect(within(alert).getByText('Se interrumpió el procesamiento y puede reanudarse.')).toBeInTheDocument()
  expect(within(alert).getByText(/DEMO: el worker dejó de responder/)).toBeInTheDocument()
  expect(within(alert).getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
  expect(screen.queryByText('Preparando experimento')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByRole('button', { name: /reanudar/i })).toBeNull()
  expect(screen.queryByText('Huella de retrieval')).toBeNull()
})

test.each([
  ['demo-scenario-failed-experiment-failed', 'El experimento falló durante la ejecución.'],
  ['demo-scenario-failed-unknown', 'El experimento terminó con un error no reconocido (código DEMO_UNKNOWN_FAILURE).'],
])('FAILED con código %s muestra el mensaje propio o genérico con el código', async (target, message) => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = target
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText(message)).toBeInTheDocument()
  expect(within(alert).getByText(/Detalle: DEMO/)).toBeInTheDocument()
})

test('422 REASONING_EFFORT_UNSUPPORTED en la creación lista los esfuerzos admitidos', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('crudo de Core', 422, 'corr-422', 'REASONING_EFFORT_UNSUPPORTED', { supportedEfforts: ['low', 'medium'] })
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No se pudo iniciar el experimento')
  expect(alert).toHaveTextContent('Esfuerzos admitidos: low, medium.')
  expect(within(alert).queryByRole('button', { name: 'Reintentar' })).toBeNull()
})

test('422 UNSUPPORTED_PROJECT en la creación muestra su mensaje propio, sin reintento', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('crudo de Core', 422, 'corr-422', 'UNSUPPORTED_PROJECT')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('no tiene framework JEST, VITEST o PHPUNIT detectado')
  expect(within(alert).queryByRole('button', { name: 'Reintentar' })).toBeNull()
})

test('503 LLM_PROVIDER_UNAVAILABLE ofrece Reintentar, que vuelve a llamar a la creación con teclado', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('crudo de Core', 503, 'corr-503', 'LLM_PROVIDER_UNAVAILABLE')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Inténtalo de nuevo en unos minutos.')
  expect(startHarness.calls).toBe(1)

  const retry = within(alert).getByRole('button', { name: 'Reintentar' })
  retry.focus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(startHarness.calls).toBe(2))
  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
})

test('B2 selector DEMO (solo mock): las opciones de escenario y error se etiquetan «DEMO · …» y el selector real ejecuta un FAILED', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  const select = await screen.findByLabelText('Target experimental')
  expect(within(select).getByRole('option', { name: 'DEMO · FAILED EXPERIMENT_WORKER_LOST' })).toBeInTheDocument()
  expect(within(select).getByRole('option', { name: 'DEMO · error 503 LLM_PROVIDER_UNAVAILABLE (reintentable)' })).toBeInTheDocument()
  expect(within(select).getAllByRole('option').filter((option) => option.textContent?.startsWith('DEMO ·')).length).toBe(10)

  await user.selectOptions(select, 'demo-scenario-failed-worker-lost')
  await user.click(screen.getByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText('Se interrumpió el procesamiento y puede reanudarse.')).toBeInTheDocument()
})

test('WI-CONSOLE-021 C1: proyecto PHP con PHPUnit (DEMO) no se bloquea: runnerHint y perfil se muestran tal cual', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  const select = await screen.findByLabelText('Target experimental')
  await user.selectOptions(select, 'demo-scenario-phpunit')
  await user.click(screen.getByRole('button', { name: 'Ejecutar comparación' }))
  expect(await screen.findByText('PHP_LARAVEL_PHPUNIT', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('PHPUNIT')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).toBeNull()
})
