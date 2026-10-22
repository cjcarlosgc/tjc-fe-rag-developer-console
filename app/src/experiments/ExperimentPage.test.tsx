import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { getCaptureNextPrState } from '../run-comparison/speculative/captureNextPr'
import { UNSUPPORTED_PROJECT_MESSAGE } from '../control-plane/errors'
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
      return actual.startExperiment(
        { ...input, symbolQualifiedName: startHarness.targetOverride ?? input.symbolQualifiedName },
        idempotencyKey,
      )
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
  const { container } = renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })

  expect(await screen.findByRole('heading', { name: 'RAG vs Agente generalista', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(EXPERIMENT_CONDITIONS_NOTE)).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de recuperación', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(screen.getByText('Laboratorio simulado')).toBeInTheDocument()
  expect(container.textContent).not.toMatch(/precision|recall/i)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('HU49 (propuesta): arma, simula la llegada del PR y navega a la comparación, quedando OFF de nuevo', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })

  expect(await screen.findByText('Capturar el próximo PR')).toBeInTheDocument()
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
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })

  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))
  expect(await screen.findByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))

  expect(await screen.findByRole('button', { name: 'Armar captura' })).toBeInTheDocument()
})

test('HU19 (live): envía el target real, sondea y presenta el resultado real', async () => {
  const project = {
    id: 'p-1',
    name: 'checkout',
    currentVersionId: 'v-1',
    workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
    role: 'ADMIN',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [
      {
        id: 'target-1',
        filePath: 'src/math.ts',
        symbolName: 'sum',
        methodName: null,
        targetType: 'FUNCTION',
        hasTest: false,
        testFilePaths: [],
      },
    ],
  }
  const symbol = { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'sum', filePath: 'src/math.ts', changeKind: 'DIRECTLY_CHANGED' }
  const run = { id: 'arun-1', projectId: 'p-1', pullRequest: { number: 1 }, symbols: [symbol] }
  const accepted = { analysisRunId: 'arun-1', experimentId: 'exp-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 10 }
  const status = {
    id: 'exp-1',
    analysisRunId: 'arun-1',
    projectId: 'p-1',
    projectVersionId: 'v-1',
    symbol,
    status: 'COMPLETED',
    completedRepetitions: 6,
    totalRepetitions: 6,
    failureCode: null,
    failureMessage: null,
    startedAt: '2026-09-07T00:00:00.000Z',
    completedAt: '2026-09-07T00:05:00.000Z',
  }
  const results = {
    experimentId: 'exp-1',
    analysisRunId: 'arun-1',
    projectVersionId: 'v-1',
    symbol,
    repetitionsPerStrategy: 3,
    completedAt: '2026-09-07T00:05:00.000Z',
    strategies: [
      {
        strategy: 'RAG',
        evaluableRepetitions: 3,
        nonEvaluableRepetitions: 0,
        validRate: 0.83,
        compilationRate: 1,
        executionRate: 0.83,
        passedRate: 0.83,
        generationDurationMs: 900,
        executionDurationMs: 200,
        totalDurationMs: 1100,
        inputTokens: 500,
        outputTokens: 200,
        totalTokens: 700,
        estimatedCost: 0.02,
        retrievedChunks: 10,
        selectedChunks: 4,
        contextTokens: 900,
        toolCalls: null,
        filesInspected: null,
        failures: {},
      },
      {
        strategy: 'GENERALIST_AGENT',
        evaluableRepetitions: 3,
        nonEvaluableRepetitions: 0,
        validRate: 0.5,
        compilationRate: 0.67,
        executionRate: 0.5,
        passedRate: 0.5,
        generationDurationMs: 1200,
        executionDurationMs: 300,
        totalDurationMs: 1500,
        inputTokens: 800,
        outputTokens: 300,
        totalTokens: 1100,
        estimatedCost: 0.03,
        retrievedChunks: null,
        selectedChunks: null,
        contextTokens: null,
        toolCalls: 5,
        filesInspected: 3,
        failures: {},
      },
    ],
    repetitions: [
      { repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: 230, errorSummary: null },
    ],
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

  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/p-1/experimental?analysisRunId=arun-1',
    routePath: '/projects/:projectId/experimental',
  })

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de exploración', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/experiments'),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
      body: JSON.stringify({ analysisRunId: 'arun-1', symbolFilePath: 'src/math.ts', symbolQualifiedName: 'sum' }),
    }),
  )
})

test('live sin analysisRunId explica cómo llegar a un Run elegible y no muestra un selector vacío', async () => {
  setDataSourceForTests('live')
  const project = {
    id: 'p-1',
    name: 'checkout',
    currentVersionId: 'v-1',
    workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
    role: 'ADMIN',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async (input) =>
      new Response(
        JSON.stringify(
          String(input).includes('/test-inventory')
            ? {
                projectVersionId: 'v-1',
                detectedFramework: 'VITEST',
                targetsTotal: 0,
                targetsWithTest: 0,
                targetsMissingTest: 0,
                targets: [],
              }
            : project,
        ),
        { status: 200 },
      ),
  )

  renderApp(<ExperimentPage />, { initialEntry: '/projects/p-1/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByText(/Abre esta comparación desde un AnalysisRun vigente/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Target experimental')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).not.toBeInTheDocument()
})

test('live sin símbolo elegible explica el criterio y no muestra un selector vacío', async () => {
  setDataSourceForTests('live')
  const project = {
    id: 'p-1',
    name: 'checkout',
    currentVersionId: 'v-1',
    workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
    role: 'ADMIN',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  }
  const run = {
    id: 'arun-no-target',
    projectId: 'p-1',
    status: 'SUCCESS',
    symbols: [
      { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'MathService', filePath: 'src/math.ts', changeKind: 'DIRECTLY_CHANGED' },
      { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'format', filePath: 'src/format.ts', changeKind: 'POTENTIALLY_AFFECTED' },
    ],
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    const value = url.includes('/analysis-runs/arun-no-target')
      ? run
      : url.includes('/test-inventory')
        ? { projectVersionId: 'v-1', detectedFramework: 'VITEST', targetsTotal: 0, targetsWithTest: 0, targetsMissingTest: 0, targets: [] }
        : project
    return new Response(JSON.stringify(value), { status: 200 })
  })

  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/p-1/experimental?analysisRunId=arun-no-target',
    routePath: '/projects/:projectId/experimental',
  })

  expect(await screen.findByText(/no tiene un símbolo METHOD o FUNCTION con cambio DIRECTLY_CHANGED/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Target experimental')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).not.toBeInTheDocument()
})

test('WI-CONSOLE-017: la descarga de evidencia no aparece mientras el experimento corre y sí al completarse', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  expect(screen.queryByRole('button', { name: 'Descargar evidencia (JSON)' })).not.toBeInTheDocument()

  expect(await screen.findByText('Huella de recuperación', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Descargar evidencia (JSON)' })).toBeInTheDocument()
})

test('FAILED visible: role alert con el copy de EXPERIMENT_WORKER_LOST, sin «Preparando experimento» y con el detalle y el rótulo DEMO', async () => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = 'demo-scenario-failed-worker-lost'
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText('El experimento no se completó')).toBeInTheDocument()
  expect(within(alert).getByText('El experimento se interrumpió; vuelve a crearlo.')).toBeInTheDocument()
  expect(within(alert).getByText(/DEMO: el worker dejó de responder/)).toBeInTheDocument()
  expect(within(alert).getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
  expect(screen.queryByText('Preparando experimento')).toBeNull()
  expect(b3Note()).toHaveTextContent('ya se lanzó')
  expect(screen.queryByRole('button', { name: /reanudar/i })).toBeNull()
  expect(screen.queryByText('Huella de recuperación')).toBeNull()
  expect(document.querySelector('.live-indicator')).toBeNull()
  expect(document.querySelector('.experiment-progress')).toBeNull()
})

test.each([
  ['demo-scenario-failed-experiment-failed', 'El experimento falló durante la ejecución.'],
  ['demo-scenario-failed-unknown', 'El experimento terminó con un error no reconocido (código DEMO_UNKNOWN_FAILURE).'],
])('FAILED con código %s muestra el mensaje propio o genérico con el código', async (target, message) => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = target
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText(message)).toBeInTheDocument()
  expect(within(alert).getByText(/Detalle: DEMO/)).toBeInTheDocument()
})

test('422 REASONING_EFFORT_UNSUPPORTED en la creación lista los esfuerzos admitidos', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('crudo de Core', 422, 'corr-422', 'REASONING_EFFORT_UNSUPPORTED', {
    supportedEfforts: ['low', 'medium'],
  })
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
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
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(UNSUPPORTED_PROJECT_MESSAGE)
  expect(within(alert).queryByRole('button', { name: 'Reintentar' })).toBeNull()
})

test('503 LLM_PROVIDER_UNAVAILABLE ofrece Reintentar, que vuelve a llamar a la creación con teclado', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('crudo de Core', 503, 'corr-503', 'LLM_PROVIDER_UNAVAILABLE')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Inténtalo de nuevo en unos minutos.')
  expect(startHarness.calls).toBe(1)

  const retry = within(alert).getByRole('button', { name: 'Reintentar' })
  retry.focus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(startHarness.calls).toBe(2))
  expect(await screen.findByText('Huella de recuperación', {}, { timeout: 5000 })).toBeInTheDocument()
})

test('B2 selector DEMO (solo mock): las opciones de escenario y error se etiquetan «DEMO · …» y el selector real ejecuta un FAILED', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })

  const select = await screen.findByLabelText('Target experimental')
  expect(within(select).getByRole('option', { name: 'DEMO · FAILED EXPERIMENT_WORKER_LOST' })).toBeInTheDocument()
  expect(within(select).getByRole('option', { name: 'DEMO · error 503 LLM_PROVIDER_UNAVAILABLE (reintentable)' })).toBeInTheDocument()
  expect(
    within(select)
      .getAllByRole('option')
      .filter((option) => option.textContent?.startsWith('DEMO ·')).length,
  ).toBe(11)

  await user.selectOptions(select, 'demo-scenario-failed-worker-lost')
  await user.click(screen.getByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText('El experimento se interrumpió; vuelve a crearlo.')).toBeInTheDocument()
})

test('WI-CONSOLE-021 C1: Project PHP con PHPUnit (DEMO) no se bloquea: runnerHint y perfil se muestran tal cual', async () => {
  setDataSourceForTests('mock')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })

  const select = await screen.findByLabelText('Target experimental')
  await user.selectOptions(select, 'demo-scenario-phpunit')
  await user.click(screen.getByRole('button', { name: 'Ejecutar comparación' }))
  expect(await screen.findByText('PHP_LARAVEL_PHPUNIT', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(screen.getByText('PHPUNIT')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('WI-CONSOLE-026: corrida legacy sin attempt ni technicallyEvaluable no muestra columnas Intento/Evaluable ni valores inventados', async () => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = 'demo-scenario-legacy'
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  const table = await screen.findByRole('table', { name: 'Tabla de repeticiones por target' })
  expect(within(table).getByRole('columnheader', { name: 'Tipo de fallo' })).toBeInTheDocument()
  expect(within(table).queryByRole('columnheader', { name: 'Intento' })).toBeNull()
  expect(within(table).queryByRole('columnheader', { name: 'Evaluable' })).toBeNull()
  expect(within(table).queryByText('1.º')).toBeNull()
  expect(within(table).queryByText('técnicamente no evaluable')).toBeNull()
})

test('WI-CONSOLE-026: corrida con attempt 2 y técnicamente no evaluable muestra Intento, Evaluable y la marca', async () => {
  setDataSourceForTests('mock')
  startHarness.targetOverride = 'demo-scenario-mixed-sandbox'
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  const table = await screen.findByRole('table', { name: 'Tabla de repeticiones por target' })
  expect(within(table).getByRole('columnheader', { name: 'Intento' })).toBeInTheDocument()
  expect(within(table).getByRole('columnheader', { name: 'Evaluable' })).toBeInTheDocument()
  expect(within(table).getByText('2.º')).toBeInTheDocument()
  expect(within(table).getByText('técnicamente no evaluable')).toBeInTheDocument()
})

// --- WI-CONSOLE-036 corte A (B1): experimentId en la URL ---
function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-search">{location.search}</output>
}

function liveB1Fetch(options: { experimentStatus?: 'COMPLETED' | 'RUNNING'; notFound?: boolean } = {}) {
  const project = {
    id: 'p-1',
    name: 'checkout',
    currentVersionId: 'v-1',
    workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
    role: 'ADMIN',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  }
  const inventory = {
    projectVersionId: 'v-1',
    detectedFramework: 'VITEST',
    targetsTotal: 1,
    targetsWithTest: 0,
    targetsMissingTest: 1,
    targets: [
      {
        id: 'target-1',
        filePath: 'src/math.ts',
        symbolName: 'sum',
        methodName: null,
        targetType: 'FUNCTION',
        hasTest: false,
        testFilePaths: [],
      },
    ],
  }
  const symbol = { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'sum', filePath: 'src/math.ts', changeKind: 'DIRECTLY_CHANGED' }
  const run = { id: 'arun-1', projectId: 'p-1', pullRequest: { number: 1 }, symbols: [symbol] }
  const accepted = { analysisRunId: 'arun-1', experimentId: 'exp-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 10 }
  const status = {
    id: 'exp-1',
    analysisRunId: 'arun-1',
    projectId: 'p-1',
    projectVersionId: 'v-1',
    symbol,
    status: options.experimentStatus ?? 'COMPLETED',
    completedRepetitions: 6,
    totalRepetitions: 6,
    failureCode: null,
    failureMessage: null,
    startedAt: '2026-09-07T00:00:00.000Z',
    completedAt: '2026-09-07T00:05:00.000Z',
  }
  const results = {
    experimentId: 'exp-1',
    analysisRunId: 'arun-1',
    projectVersionId: 'v-1',
    symbol,
    repetitionsPerStrategy: 3,
    completedAt: '2026-09-07T00:05:00.000Z',
    strategies: [
      {
        strategy: 'RAG',
        evaluableRepetitions: 3,
        nonEvaluableRepetitions: 0,
        validRate: 0.83,
        compilationRate: 1,
        executionRate: 0.83,
        passedRate: 0.83,
        generationDurationMs: 900,
        executionDurationMs: 200,
        totalDurationMs: 1100,
        inputTokens: 500,
        outputTokens: 200,
        totalTokens: 700,
        estimatedCost: 0.02,
        retrievedChunks: 10,
        selectedChunks: 4,
        contextTokens: 900,
        toolCalls: null,
        filesInspected: null,
        failures: {},
      },
      {
        strategy: 'GENERALIST_AGENT',
        evaluableRepetitions: 3,
        nonEvaluableRepetitions: 0,
        validRate: 0.5,
        compilationRate: 0.67,
        executionRate: 0.5,
        passedRate: 0.5,
        generationDurationMs: 1200,
        executionDurationMs: 300,
        totalDurationMs: 1500,
        inputTokens: 800,
        outputTokens: 300,
        totalTokens: 1100,
        estimatedCost: 0.03,
        retrievedChunks: null,
        selectedChunks: null,
        contextTokens: null,
        toolCalls: 5,
        filesInspected: 3,
        failures: {},
      },
    ],
    repetitions: [
      { repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', totalDurationMs: 350, totalTokens: 230, errorSummary: null },
    ],
  }
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.includes('/experiments/exp-404'))
      return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Experimento no encontrado' }), { status: 404 })
    if (url.includes('/experiments/exp-1/results')) return new Response(JSON.stringify(results), { status: 200 })
    if (url.includes('/experiments/exp-1')) return new Response(JSON.stringify(status), { status: 200 })
    if (url.includes('/experiments') && init?.method === 'POST') return new Response(JSON.stringify(accepted), { status: 202 })
    if (url.includes('/analysis-runs/arun-1')) return new Response(JSON.stringify(run), { status: 200 })
    return new Response(JSON.stringify(url.includes('/test-inventory') ? inventory : project), { status: 200 })
  })
}

function renderB1(initialEntry: string) {
  return renderApp(
    <>
      <ExperimentPage />
      <LocationProbe />
    </>,
    { initialEntry, routePath: '/projects/:projectId/experimental' },
  )
}

test('WI-CONSOLE-036 B1: tras lanzar con éxito la URL contiene analysisRunId y experimentId', async () => {
  setDataSourceForTests('live')
  liveB1Fetch()
  const user = userEvent.setup()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1')

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  await waitFor(() => {
    const search = new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
    expect(search.get('analysisRunId')).toBe('arun-1')
    expect(search.get('experimentId')).toBe('exp-1')
  })
})

test('WI-CONSOLE-036 B1: montar con experimentId reabre el experimento sin pulsar el botón y lo deja deshabilitado', async () => {
  setDataSourceForTests('live')
  const fetchMock = liveB1Fetch()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-1')

  expect(await screen.findByText('Huella de exploración', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/experiments/exp-1'), expect.not.objectContaining({ method: 'POST' }))
  expect(screen.getByRole('button', { name: 'Ejecutar comparación' })).toBeDisabled()
})

test('WI-CONSOLE-036 B1: un experimentId inexistente (404) conserva el id en la URL', async () => {
  setDataSourceForTests('live')
  const fetchMock = liveB1Fetch()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-404')

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/experiments/exp-404'), expect.anything()))
  expect(new URLSearchParams(screen.getByTestId('location-search').textContent ?? '').get('experimentId')).toBe('exp-404')
})

test('WI-CONSOLE-036 B1: «Ver contexto →» conserva analysisRunId en la query y no se llama al listado de experimentos', async () => {
  setDataSourceForTests('live')
  const fetchMock = liveB1Fetch()
  const user = userEvent.setup()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-1')

  await user.click(await screen.findByText('Ver detalle por target y repetición'))
  expect(screen.getByRole('link', { name: /Ver contexto/ })).toHaveAttribute(
    'href',
    '/projects/p-1/experimental/exp-1/context?strategy=RAG&repetition=1&analysisRunId=arun-1',
  )
  const listCalls = fetchMock.mock.calls.filter(
    ([input, init]) => /\/experiments(\?|$)/.test(String(input)) && (init?.method ?? 'GET') === 'GET',
  )
  expect(listCalls).toHaveLength(0)
})

// --- WI-CONSOLE-036 corte B (B3): nota de estado única y error de consulta ---
const B3_PROJECT = {
  id: 'p-1',
  name: 'checkout',
  currentVersionId: 'v-1',
  workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
  role: 'ADMIN',
  createdAt: '2026-09-01',
  updatedAt: '2026-09-01',
}

function liveB3Fetch(options: { projectRole?: string; holdPost?: boolean; noEligible?: boolean; notFoundCorrelationId?: string } = {}) {
  const base = liveB1Fetch()
  const original = base.getMockImplementation()!
  const fetchMock = base.mockImplementation(async (input, init) => {
    const url = String(input)
    if (options.holdPost && init?.method === 'POST') return new Promise<Response>(() => {})
    if (options.notFoundCorrelationId && url.includes('/experiments/exp-404')) {
      return new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Experimento no encontrado', correlationId: options.notFoundCorrelationId }),
        { status: 404 },
      )
    }
    if (options.noEligible && url.includes('/analysis-runs/arun-1'))
      return new Response(JSON.stringify({ id: 'arun-1', projectId: 'p-1', status: 'SUCCESS', symbols: [] }), { status: 200 })
    if (options.projectRole && !/\/test-inventory|\/analysis-runs|\/experiments/.test(url))
      return new Response(JSON.stringify({ ...B3_PROJECT, role: options.projectRole }), { status: 200 })
    return original(input, init)
  })
  return fetchMock
}

function b3Note() {
  return document.getElementById('experiment-run-note')
}
// La página comparte región role="status" con la app: las pruebas B3 localizan la nota por id.

test('WI-CONSOLE-036 B3: con rol de solo lectura, la única nota role="status" explica el motivo', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ projectRole: 'READER' })
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1')

  await waitFor(() => expect(b3Note()).toHaveTextContent('Tu rol es de solo lectura'))
  expect(b3Note()!.getAttribute('role')).toBe('status')
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).toBeNull()
})

test('WI-CONSOLE-036 B3: con experimentId ya lanzado, el botón queda deshabilitado y su nota (aria-describedby) explica por qué', async () => {
  setDataSourceForTests('live')
  liveB3Fetch()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-1')

  const button = await screen.findByRole('button', { name: 'Ejecutar comparación' })
  expect(button).toBeDisabled()
  const describedBy = button.getAttribute('aria-describedby')
  expect(describedBy).toBe('experiment-run-note')
  expect(document.getElementById(describedBy!)).toHaveTextContent('Esta comparación ya se lanzó')
})

test('WI-CONSOLE-036 B3: mientras la creación está en curso, la nota lo dice y el botón queda ocupado', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ holdPost: true })
  const user = userEvent.setup()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1')

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const pending = await screen.findByRole('button', { name: 'Creando comparación…' })
  expect(pending).toBeDisabled()
  expect(pending.getAttribute('aria-describedby')).toBe('experiment-run-note')
  expect(document.getElementById('experiment-run-note')).toHaveTextContent('Creando comparación')
})

test('WI-CONSOLE-036 B3: un Run no elegible muestra el motivo en la única nota role="status" y no hay selector', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ noEligible: true })
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1')

  await waitFor(() => expect(b3Note()).toHaveTextContent('no tiene un símbolo METHOD o FUNCTION con cambio DIRECTLY_CHANGED'))
  expect(document.querySelectorAll('#experiment-run-note')).toHaveLength(1)
  expect(screen.getAllByText(/no tiene un símbolo METHOD/)).toHaveLength(1)
  expect(screen.queryByLabelText('Target experimental')).toBeNull()
})

test('WI-CONSOLE-036 B3: con botón habilitado, la nota persistente sigue montada y vacía y el botón la referencia', async () => {
  setDataSourceForTests('live')
  liveB3Fetch()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1')

  const button = await screen.findByRole('button', { name: 'Ejecutar comparación' })
  expect(button).toBeEnabled()
  expect(button.getAttribute('aria-describedby')).toBe('experiment-run-note')
  expect(b3Note()).toBeEmptyDOMElement()
})

test('WI-CONSOLE-036 B3: getExperiment que rechaza muestra alert con mensaje, correlation id y Reintentar, sin «Preparando experimento»', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ notFoundCorrelationId: 'corr-404' })
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-404')

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No se pudo cargar el experimento')
  expect(alert).toHaveTextContent('corr-404')
  expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  expect(screen.queryByText('Preparando experimento')).toBeNull()
})

test('WI-CONSOLE-036 B3: tras el error no hay sondeo en bucle y Reintentar vuelve a pedir el experimento una vez', async () => {
  setDataSourceForTests('live')
  const fetchMock = liveB3Fetch({ notFoundCorrelationId: 'corr-404' })
  const user = userEvent.setup()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-404')

  const alert = await screen.findByRole('alert')
  const countFor = () => fetchMock.mock.calls.filter(([input]) => String(input).includes('/experiments/exp-404')).length
  await new Promise((resolve) => setTimeout(resolve, 150))
  const settled = countFor()
  await new Promise((resolve) => setTimeout(resolve, 150))
  expect(countFor()).toBe(settled)

  await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))
  await waitFor(() => expect(countFor()).toBe(settled + 1))
})

test('WI-CONSOLE-036 B4: POST 404 UNRESOLVABLE_TARGET muestra el copy propio, no el crudo de Core', async () => {
  setDataSourceForTests('mock')
  startHarness.error = new ApiError('El TestTarget no existe o no pertenece a este Project.', 404, 'corr-target', 'UNRESOLVABLE_TARGET')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/prj_checkout_demo/experimental',
    routePath: '/projects/:projectId/experimental',
  })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No pudimos localizar el target elegido en el código de este Run.')
  expect(alert).not.toHaveTextContent('El TestTarget no existe')
})

// --- WI-CONSOLE-036 corrección UX ciclo 1: error de consulta con experimentId en la URL ---
test('WI-CONSOLE-036 UX c1: si la consulta del experimento de la URL falla, la nota no dice «ya se lanzó» y explica la salida', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ notFoundCorrelationId: 'corr-404' })
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-404')

  await screen.findByRole('alert')
  expect(b3Note()).not.toHaveTextContent('ya se lanzó')
  expect(b3Note()).toHaveTextContent('No se pudo cargar el experimento de la URL; reintenta o inicia otra comparación.')
})

test('WI-CONSOLE-036 UX c1: «Iniciar otra comparación» quita experimentId, conserva analysisRunId y rehabilita el botón', async () => {
  setDataSourceForTests('live')
  liveB3Fetch({ notFoundCorrelationId: 'corr-404' })
  const user = userEvent.setup()
  renderB1('/projects/p-1/experimental?analysisRunId=arun-1&experimentId=exp-404')

  const alert = await screen.findByRole('alert')
  await user.click(within(alert).getByRole('button', { name: 'Iniciar otra comparación' }))

  await waitFor(() => {
    const search = new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
    expect(search.get('experimentId')).toBeNull()
    expect(search.get('analysisRunId')).toBe('arun-1')
  })
  expect(await screen.findByRole('button', { name: 'Ejecutar comparación' })).toBeEnabled()
  expect(screen.queryByRole('alert')).toBeNull()
})
