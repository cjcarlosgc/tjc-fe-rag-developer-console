import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { renderApp } from '../test/render'
import { AppShell } from '../ui/AppShell'
import { RunComparisonPage } from '../run-comparison/RunComparisonPage'
import { ExperimentPage } from './ExperimentPage'
import { ExperimentComparison } from './ExperimentComparison'
import { EXPERIMENT_CONDITIONS_NOTE } from './ExperimentConditionsNote'
import type { ExperimentResultViewModel } from './types'

// Estado compartido con el mock de ExperimentComparison: `invert` intercambia las tasas
// (agente > RAG) sin tocar el componente real ni la lógica de presentación.
const harness = vi.hoisted(() => ({ invert: false }))

vi.mock('./ExperimentComparison', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ExperimentComparison')>()
  return {
    ...actual,
    ExperimentComparison: (props: { result: ExperimentResultViewModel; projectId: string; experimentId: string }) => {
      const result = harness.invert ? { ...props.result, baseline: props.result.rag, rag: props.result.baseline } : props.result
      return createElement(actual.ExperimentComparison, { ...props, result })
    },
  }
})

const FORBIDDEN = /paridad|ganador|superior|winner|veredicto|outperform|gana\b/i

function renderBanner(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes><Route path="/" element={<AppShell />}><Route index element={ui} /></Route></Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
  localStorage.clear()
})

function assertNoAutomaticVerdict(container: HTMLElement) {
  const text = container.textContent ?? ''
  expect(text).not.toMatch(FORBIDDEN)
  expect(container.querySelector('[class*="winner"], [class*="ganador"], [class*="verdict"], [data-winner], [role="img"][aria-label*="ganador" i]')).toBeNull()
  for (const node of Array.from(container.querySelectorAll('[class*="delta"]'))) expect(node.getAttribute('class')).toBe('rate-delta')
  expect(text).not.toMatch(/precision|recall/i)
}

for (const invert of [false, true]) {
  const label = invert ? 'invertidas (agente > RAG)' : 'RAG > agente'

  test(`ExperimentPage con resultado completado, tasas ${label}: sin veredicto automático y con nota exacta`, async () => {
    harness.invert = invert
    const user = userEvent.setup()
    const { container } = renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

    await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
    expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()

    expect(screen.getByText(EXPERIMENT_CONDITIONS_NOTE)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Configuración' })).toBeInTheDocument()
    await user.click(screen.getByText('Ver detalle por target y repetición'))
    expect(screen.getByText('técnicamente no evaluable')).toBeVisible()
    assertNoAutomaticVerdict(container)
    expect(screen.queryByRole('status', { name: /ganador/i })).toBeNull()
  })

  test(`RunComparisonPage con resultado completado, tasas ${label}: sin veredicto automático y con nota exacta`, async () => {
    harness.invert = invert
    const { container } = renderApp(<RunComparisonPage />, { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr45/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' })

    expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()

    expect(screen.getByText(EXPERIMENT_CONDITIONS_NOTE)).toBeInTheDocument()
    assertNoAutomaticVerdict(container)
  })
}

test('el banner DEMO · DATOS SIMULADOS sigue visible junto a las pantallas de comparación', async () => {
  harness.invert = false
  renderBanner(<div>Inicio</div>)
  expect(await screen.findByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
})

test('la comparación de tasas no expone una insignia de resultado automático', async () => {
  harness.invert = false
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  const table = await screen.findByRole('table', { name: 'Comparación de estrategias' })
  expect(within(table).queryByText(FORBIDDEN)).toBeNull()
})

test('sin datos evaluables (tasas y medias null, evaluableRepetitions 0): sin delta, sin 0 % y sin veredicto', () => {
  harness.invert = false
  const noData: ExperimentResultViewModel = {
    baseline: { strategy: 'GENERALIST_AGENT', validRate: null, compilationRate: null, executionRate: null, passedRate: null, generationDurationMs: null, executionDurationMs: null, totalDurationMs: null, totalTokens: null, estimatedCost: null, failures: {}, evaluableRepetitions: 0, nonEvaluableRepetitions: 3 },
    rag: { strategy: 'RAG', validRate: .5, compilationRate: .5, executionRate: .5, passedRate: .5, generationDurationMs: 100, executionDurationMs: null, totalDurationMs: 100, totalTokens: null, estimatedCost: null, failures: {}, evaluableRepetitions: 3, nonEvaluableRepetitions: 0 },
    repetitions: [],
  }
  const { container } = render(<MemoryRouter><ExperimentComparison result={noData} projectId="prj_checkout_demo" experimentId="exp_demo" /></MemoryRouter>)
  expect(screen.getByText('sin datos evaluables · 0 evaluables · 3 no evaluables')).toBeInTheDocument()
  expect(screen.getAllByText('sin datos').length).toBeGreaterThan(0)
  assertNoAutomaticVerdict(container)
})
