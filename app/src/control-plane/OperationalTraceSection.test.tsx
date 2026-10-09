import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import { PendingContractError, setDataSourceForTests } from '../api/dataSource'
import { mockCreateTestPublication, mockGetAnalysisRunTrace, resetMockBackend, setMockAnalysisRunForTests } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { AnalysisRunDetailPage } from './AnalysisRunDetailPage'
import { getAnalysisRunTrace } from './api'
import { OperationalTraceSection } from './OperationalTraceSection'
import type { AnalysisRunTraceResponse } from './operationalTraceTypes'

// El trace por defecto delega en el adapter real (mock); cada prueba puede forzar una respuesta concreta.
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, getAnalysisRunTrace: vi.fn((id: string) => actual.getAnalysisRunTrace(id)) }
})

const traceMock = vi.mocked(getAnalysisRunTrace)

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
  // mockReset limpia también las respuestas persistentes de pruebas anteriores (mockRejectedValue).
  traceMock.mockReset()
  traceMock.mockImplementation((id: string) => mockGetAnalysisRunTrace(id))
})

afterEach(() => {
  setDataSourceForTests(null)
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true })
})

function renderTrace(analysisRunId: string, projectId: string) {
  return renderApp(<OperationalTraceSection analysisRunId={analysisRunId} projectId={projectId} />)
}

function renderDetail(analysisRunId: string, projectId: string) {
  return renderApp(<AnalysisRunDetailPage />, { initialEntry: `/projects/${projectId}/runs/${analysisRunId}`, routePath: '/projects/:projectId/runs/:analysisRunId' })
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true, writable: true })
}

function headingTexts(): string[] {
  return screen.getAllByRole('heading').map((heading) => heading.textContent ?? '')
}

test('orden de secciones del trace: nueve enlaces en orden para un Run con dos targets', async () => {
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Changeset' })
  expect(headingTexts()).toEqual([
    'Trace operativo',
    'Repositorio y Pull Request',
    'Analysis Run',
    'Changeset',
    'Target: OrderService.calculateTotal',
    'Retrieval PRESENT',
    'Contexto PRESENT',
    'Generación PRESENT',
    'Ejecuciones PRESENT',
    'Target: formatCurrency',
    'Retrieval PRESENT',
    'Contexto PRESENT',
    'Generación PRESENT',
    'Ejecuciones PRESENT',
    'Publicación NOT_APPLICABLE',
  ])
  expect(screen.getByRole('region', { name: 'Trace operativo' })).toBeInTheDocument()
})

test('PRESENT y NOT_APPLICABLE: badge con texto, NOT_APPLICABLE informativo y sin error', async () => {
  renderTrace('arun_checkout_pr42', 'prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Changeset' })
  expect(screen.getAllByText('NOT_APPLICABLE').length).toBeGreaterThan(0)
  expect(screen.getAllByText('No aplica: el flujo terminó antes de este paso.').length).toBeGreaterThan(0)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('outcome se muestra tal cual y no aparecen veredictos CUMPLE / NO CUMPLE', async () => {
  renderTrace('arun_checkout_pr46', 'prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Changeset' })
  expect(screen.getByText('BEHAVIORAL_MISMATCH', { selector: 'code' })).toBeInTheDocument()
  expect(screen.queryByText(/CUMPLE/)).not.toBeInTheDocument()
  expect(screen.queryByText(/NO CUMPLE/)).not.toBeInTheDocument()
})

test('Run sin targets: estado informativo con targetCount', async () => {
  renderTrace('arun_billing_pr22', 'prj_billing_demo')

  expect(await screen.findByText('Sin targets')).toBeInTheDocument()
  expect(screen.getByText('targetCount')).toBeInTheDocument()
  expect(screen.getByText('targetCount').nextElementSibling).toHaveTextContent('0')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('FK existente enlaza a la regla; FK ausente queda como texto plano', async () => {
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  const link = await screen.findByRole('link', { name: 'fk_rounding_v2' })
  expect(link).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v2')

  const missing = screen.getByText('fk_demo_regla_inexistente')
  expect(missing.closest('a')).toBeNull()
})

test('botones Copiar con nombre accesible específico', async () => {
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Changeset' })
  for (const label of ['analysisRunId', 'headSha', 'retrieval_id', 'context_id', 'execution_id']) {
    expect(screen.getAllByRole('button', { name: new RegExp(`^Copiar ${label} `) }).length).toBeGreaterThan(0)
  }
})

test('Copiar: éxito anuncia Copiado en role status y copia el valor completo', async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  setClipboard({ writeText })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  const button = await screen.findByRole('button', { name: 'Copiar retrieval_id ret_demo_pr45_total' })
  await user.click(button)

  expect(writeText).toHaveBeenCalledWith('ret_demo_pr45_total')
  const status = await screen.findByText('Copiado')
  expect(status.closest('[role="status"]')).toHaveAttribute('aria-live', 'polite')
})

test('Copiar: fallo del portapapeles muestra "No se pudo copiar" sin lanzar', async () => {
  const user = userEvent.setup()
  setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  await user.click(await screen.findByRole('button', { name: 'Copiar execution_id exec_demo_pr45_1' }))
  expect((await screen.findByText('No se pudo copiar')).closest('[role="status"]')).toHaveAttribute('aria-live', 'polite')
})

test('Copiar: sin navigator.clipboard muestra el mismo fallo', async () => {
  const user = userEvent.setup()
  setClipboard(undefined)
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  await user.click(await screen.findByRole('button', { name: /^Copiar headSha e5e5e5e/ }))
  expect(await screen.findByText('No se pudo copiar')).toBeInTheDocument()
})

test('Copiar: Enter y Espacio activan el botón con teclado', async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  setClipboard({ writeText })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  const button = await screen.findByRole('button', { name: 'Copiar execution_id exec_demo_pr45_1' })
  button.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')

  expect(writeText).toHaveBeenCalledTimes(2)
  expect(writeText).toHaveBeenLastCalledWith('exec_demo_pr45_1')
})

test('QUEUED: 409 EVIDENCE_NOT_FINISHED es estado informativo con role status, no ErrorState', async () => {
  renderTrace('arun_checkout_pr53', 'prj_checkout_demo')

  expect(await screen.findByText(/El Run aún se procesa/)).toHaveAttribute('role', 'status')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
})

test('QUEUED sondea hasta que el Run termina y muestra el trace', async () => {
  renderTrace('arun_checkout_pr53', 'prj_checkout_demo')

  await screen.findByText(/El Run aún se procesa/)
  setMockAnalysisRunForTests('arun_checkout_pr53', { status: 'NO_TEST_RELEVANT_CHANGES' })

  expect(await screen.findByRole('heading', { name: 'Changeset' })).toBeInTheDocument()
  expect(screen.getByText('arun_checkout_pr53')).toBeInTheDocument()
  expect(screen.queryByText(/El Run aún se procesa/)).not.toBeInTheDocument()
  expect(traceMock.mock.calls.length).toBeGreaterThan(1)
})

test('PROCESSING (409) del run solo-trace también se muestra como en proceso', async () => {
  renderTrace('arun_billing_pr25', 'prj_billing_demo')

  expect(await screen.findByText(/El Run aún se procesa/)).toHaveAttribute('role', 'status')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('404: ErrorState con reintento y correlationId', async () => {
  const user = userEvent.setup()
  traceMock.mockRejectedValueOnce(new ApiError('No existe el Analysis Run demo.', 404, 'corr-404', 'ANALYSIS_RUN_NOT_FOUND'))
  renderTrace('arun_inexistente', 'prj_checkout_demo')

  const alert = await screen.findByRole('alert')
  expect(within(alert).getByText('corr-404')).toBeInTheDocument()
  await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))
  await waitFor(() => expect(traceMock).toHaveBeenCalledTimes(2))
})

test('error genérico muestra ErrorState con correlationId (tras los reintentos del hook)', async () => {
  traceMock.mockRejectedValue(new ApiError('Fallo interno.', 500, 'corr-500', 'INTERNAL'))
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  const alert = await screen.findByRole('alert', {}, { timeout: 6000 })
  expect(alert).toHaveTextContent('Fallo interno.')
  expect(within(alert).getByText('corr-500')).toBeInTheDocument()
}, 10000)

test('contrato pendiente (live) muestra el mensaje del adapter sin crash', async () => {
  setDataSourceForTests('live')
  traceMock.mockRejectedValueOnce(new PendingContractError('el trace operativo de un Analysis Run'))
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByText('Contrato pendiente')).toBeInTheDocument()
  expect(screen.getByText(/RAG Core todavía no publicó el contrato live para el trace operativo/)).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('publicación CURRENT tras publicar; sin publicar es NOT_APPLICABLE', async () => {
  await mockCreateTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByText('Vigente respecto al HEAD (CURRENT)')).toBeInTheDocument()
  expect(screen.getByText('companionBranch').nextElementSibling).toHaveTextContent('rag-tests/pr-45')
  expect(screen.getByText('checkId').nextElementSibling).toHaveTextContent('sin dato')
})

test('publicación STALE cuando el HEAD cambió después de publicar', async () => {
  await mockCreateTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
  setMockAnalysisRunForTests('arun_checkout_pr45', { headSha: 'e6e6e6e' })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByText('Desactualizada: el HEAD cambió (STALE)')).toBeInTheDocument()
})

test('companionPullRequestUrl https se enlaza con rel seguro; una URL insegura no se enlaza', async () => {
  const base = await mockGetAnalysisRunTrace('arun_checkout_pr45')
  const publication = { status: 'PRESENT' as const, checkId: null, companionBranch: 'rag-tests/pr-45', companionPullRequestUrl: 'https://github.com/acme/checkout-service/pull/99', sourceHeadSha: 'e5e5e5e', freshness: 'CURRENT' as const }
  traceMock.mockResolvedValueOnce({ ...base, publication } satisfies AnalysisRunTraceResponse)
  const { unmount } = renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  const link = await screen.findByRole('link', { name: 'Companion PR' })
  expect(link).toHaveAttribute('href', 'https://github.com/acme/checkout-service/pull/99')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  unmount()

  traceMock.mockResolvedValueOnce({ ...base, publication: { ...publication, companionPullRequestUrl: 'javascript:alert(1)' } })
  renderTrace('arun_checkout_pr45', 'prj_checkout_demo')

  await screen.findByText(/URL no válida, no se enlaza/)
  expect(screen.queryByRole('link', { name: 'Companion PR' })).not.toBeInTheDocument()
})

test('el detalle del run QUEUED (mock) resuelve el Run y muestra el estado y el trace en curso', async () => {
  renderDetail('arun_checkout_pr53', 'prj_checkout_demo')

  expect(await screen.findByText('En cola', { selector: '.status-badge' })).toBeInTheDocument()
  expect(await screen.findByText(/El Run aún se procesa/)).toBeInTheDocument()
})

test('el detalle del run PROCESSING (mock) resuelve el Run', async () => {
  renderDetail('arun_billing_pr25', 'prj_billing_demo')

  expect(await screen.findByText('Procesando', { selector: '.status-badge' })).toBeInTheDocument()
  expect(await screen.findByText(/El Run aún se procesa/)).toBeInTheDocument()
})

test('la sección se monta en el detalle con rótulo de datos simulados en mock', async () => {
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByRole('region', { name: 'Trace operativo' })).toBeInTheDocument()
  expect(screen.getByText(/Datos simulados: los ids de esta sección son de demo/)).toBeInTheDocument()
  expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
})
