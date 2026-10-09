import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { ApiError } from '../api/client'
import { renderApp } from '../test/render'
import { RetrievalComparisonPage } from './RetrievalComparisonPage'

// Overrides controlados de la capa api: el mock no puede producir 404/409/422/403 ni FAILED desde la UI, así que los
// tests que lo necesitan sustituyen solo esas dos funciones. Sin override, todo sigue siendo el mock real.
const overrides = vi.hoisted(() => ({
  start: null as null | ((...args: unknown[]) => Promise<unknown>),
  detail: null as null | ((...args: unknown[]) => Promise<unknown>),
}))

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    startRetrievalComparison: (...args: Parameters<typeof actual.startRetrievalComparison>) =>
      overrides.start ? overrides.start(...args) : actual.startRetrievalComparison(...args),
    getRetrievalComparison: (...args: Parameters<typeof actual.getRetrievalComparison>) =>
      overrides.detail ? overrides.detail(...args) : actual.getRetrievalComparison(...args),
  }
})

const FORMAT_CURRENCY = 'src/shared/money.ts::formatCurrency'
const CREATE_ORDER = 'src/domain/OrderService.ts::OrderService.createOrder'
const ROUTE = '/projects/:projectId/runs/:analysisRunId/retrieval-comparison'
const MULTI_RUN = '/projects/prj_checkout_demo/runs/arun_checkout_pr49/retrieval-comparison'
const SINGLE_RUN = '/projects/prj_checkout_demo/runs/arun_checkout_pr45/retrieval-comparison'
const READER_RUN = '/projects/prj_org_metrics_demo/runs/arun_org_metrics_pr15/retrieval-comparison'

function renderPage(initialEntry: string) {
  return renderApp(<RetrievalComparisonPage />, { initialEntry, routePath: ROUTE })
}

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
  overrides.start = null
  overrides.detail = null
})

afterEach(() => {
  overrides.start = null
  overrides.detail = null
})

describe('RetrievalComparisonPage (WI-CONSOLE-014, Corte B)', () => {
  it('un único h1, rótulo experimental, sello DEMO y sin lenguaje de ganador ni estadística', async () => {
    renderPage(MULTI_RUN)
    await screen.findByLabelText('Símbolo a comparar')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Modo experimental')).toBeInTheDocument()
    expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
    expect(screen.getByText('SE y SEM no son equivalentes a RAG ni a GA')).toBeInTheDocument()
    expect(screen.queryByText(/ganador|mejor|peor|significancia|delta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('con un único símbolo elegible NO arranca la comparación sola', async () => {
    renderPage(SINGLE_RUN)
    const select = await screen.findByLabelText('Símbolo a comparar') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Elige un símbolo')
    expect(screen.getByText('Todavía no hay comparaciones de retrieval en este Run.')).toBeInTheDocument()
  })

  it('con varios símbolos el botón queda deshabilitado con motivo hasta elegir uno', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    const select = await screen.findByLabelText('Símbolo a comparar') as HTMLSelectElement
    expect(select.options).toHaveLength(4)
    const button = screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Motivo: falta elegir un símbolo.')
    await user.selectOptions(select, FORMAT_CURRENCY)
    expect(button).toBeEnabled()
    expect(screen.getByText('Símbolo elegido: formatCurrency')).toBeInTheDocument()
  })

  it('un Reader ve la nota de rol y las previas, pero no la acción', async () => {
    renderPage(READER_RUN)
    expect(await screen.findByText(/Solo un Writer, Maintainer o Admin/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comparar retrieval SE vs SEM' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Símbolo a comparar')).not.toBeInTheDocument()
  })

  it('B3: un Reader recibe un estado de solo lectura, sin invitación a elegir ni pulsar', async () => {
    renderPage(READER_RUN)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solo lectura'))
    const status = screen.getByRole('status')
    expect(status).not.toHaveTextContent('Elige un símbolo')
    expect(status).not.toHaveTextContent('pulsa')
  })

  it('B1: al completar, la lista de previas deja de mostrar la comparación en curso como Pendiente', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), CREATE_ORDER)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    expect(await screen.findByText('Comparación completada. Resultados disponibles abajo.', {}, { timeout: 3000 })).toBeInTheDocument()
    // Dos COMPLETED de seed más la recién completada: la lista debe reflejarlo sin recargar la página.
    await waitFor(() => {
      const list = screen.getByRole('list', { name: 'Comparaciones previas del Run' })
      expect(within(list).getAllByText('Estado: Completada (COMPLETED)')).toHaveLength(3)
    }, { timeout: 3000 })
  })

  it('N1-N3: SEM no muestra «null» ni «Sin relación estructural»; captions, métricas y regiones distinguen el modo', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    const list = await screen.findByRole('list', { name: 'Comparaciones previas del Run' })
    const withMetrics = within(list).getAllByRole('listitem').find((item) => item.textContent?.includes('rcmp_demo_seed_completed_con_metricas'))!
    await user.click(within(withMetrics).getByRole('button', { name: /Ver resultado/ }))
    await screen.findByRole('heading', { level: 2, name: 'Resultado de OrderService.createOrder' })

    const semTable = screen.getByRole('table', { name: 'Candidatos por ranking del modo SEM' })
    expect(screen.getByRole('table', { name: 'Candidatos por ranking del modo SE' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Candidatos del modo SEM' })).toContainElement(semTable)
    expect(screen.getByRole('heading', { level: 3, name: 'Métricas del modo SE' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Métricas del modo SEM' })).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(within(semTable).queryByText('Sin relación estructural')).not.toBeInTheDocument()
    expect(within(semTable).getAllByText('no aplica').length).toBeGreaterThan(0)
  })

  it('N4: una previa FAILED muestra failureCode y failureMessage visibles', async () => {
    renderPage(MULTI_RUN)
    const list = await screen.findByRole('list', { name: 'Comparaciones previas del Run' })
    const failed = within(list).getAllByRole('listitem').find((item) => item.textContent?.includes('rcmp_demo_seed_failed'))!
    expect(within(failed).getByText('DEMO_EMBEDDING_INDEX_UNAVAILABLE')).toBeInTheDocument()
    expect(within(failed).getByText(/el índice de embeddings no respondió/)).toBeInTheDocument()
  })

  it('el flujo PENDING → RUNNING → COMPLETED sin métricas muestra cuatro «no disponible» por modo y mueve el foco al resultado', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), CREATE_ORDER)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))

    expect(await screen.findByText('Comparación completada. Resultados disponibles abajo.', {}, { timeout: 3000 })).toBeInTheDocument()
    const heading = await screen.findByRole('heading', { level: 2, name: 'Resultado de OrderService.createOrder' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getAllByText('no disponible')).toHaveLength(8)
    expect(screen.getAllByText('no aplica').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('columnheader', { name: 'semanticScore' })).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Comparación completada')
  })

  it('un COMPLETED con métricas («Ver resultado») muestra P@10 y R@10 destacadas y ningún «no disponible»', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    const list = await screen.findByRole('list', { name: 'Comparaciones previas del Run' })
    const withMetrics = within(list).getAllByRole('listitem').find((item) => item.textContent?.includes('rcmp_demo_seed_completed_con_metricas'))!
    await user.click(within(withMetrics).getByRole('button', { name: /Ver resultado/ }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Resultado de OrderService.createOrder' })).toBeInTheDocument()
    expect(screen.queryByText('no disponible')).not.toBeInTheDocument()
    expect(screen.getAllByText('P@10')).toHaveLength(2)
    expect(screen.getAllByText('R@10')).toHaveLength(2)
  })

  it('las previas se listan sin reemplazarse y solo las COMPLETED tienen «Ver resultado» (conteos literales)', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    const list = await screen.findByRole('list', { name: 'Comparaciones previas del Run' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(within(list).getAllByRole('button', { name: /Ver resultado/ })).toHaveLength(2)
    expect(screen.getByText('Estado: Fallida (FAILED)')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Símbolo a comparar'), FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    // La nueva comparación se añade a las cinco previas; ninguna se reemplaza.
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Comparaciones previas del Run' })).getAllByRole('listitem')).toHaveLength(6), { timeout: 3000 })
  })

  it('un FAILED muestra failureCode y failureMessage literales en role=alert y no pide resultados', async () => {
    overrides.start = async (_run: unknown, symbol: unknown, key: unknown) => ({ status: 'PENDING', pollAfterMs: 10, analysisRunId: 'arun_checkout_pr49', retrievalComparisonId: 'rcmp_override_failed', projectVersionId: 'ver_x', _key: key, _symbol: symbol })
    overrides.detail = async () => ({
      id: 'rcmp_override_failed', analysisRunId: 'arun_checkout_pr49', projectId: 'prj_checkout_demo', projectVersionId: 'ver_x',
      symbol: { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'formatCurrency', filePath: 'src/x.ts', changeKind: 'DIRECTLY_CHANGED' },
      status: 'FAILED', failureCode: 'DEMO_EMBEDDING_INDEX_UNAVAILABLE', failureMessage: 'Demo: el índice de embeddings no respondió.', startedAt: null, completedAt: null,
    })
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('DEMO_EMBEDDING_INDEX_UNAVAILABLE')
    expect(alert).toHaveTextContent('Demo: el índice de embeddings no respondió.')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: /Resultado de/ })).not.toBeInTheDocument()
  })

  it.each([
    [404, 'ANALYSIS_SYMBOL_NOT_FOUND', 'Ese símbolo ya no pertenece a este Run. Actualiza el Run y vuelve a elegirlo.'],
    [422, 'UNSUPPORTED_SYMBOL_KIND', 'Solo se pueden comparar métodos o funciones con cambio directo en este Run.'],
    [409, 'IDEMPOTENCY_CONFLICT', 'Esa clave de idempotencia ya se usó para otra comparación. Inicia la comparación de nuevo desde la página.'],
    [403, 'PROJECT_ROLE_INSUFFICIENT', 'Tu rol actual (WRITER) no alcanza para esta acción; se requiere ADMIN.'],
  ])('error %i %s: alerta con mensaje propio y Correlation ID', async (status, code, message) => {
    overrides.start = async () => {
      throw new ApiError('mensaje crudo', status, 'corr-retrieval-1', code, code === 'PROJECT_ROLE_INSUFFICIENT' ? { requiredRole: 'ADMIN', currentRole: 'WRITER' } : undefined)
    }
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(alert).toHaveTextContent('corr-retrieval-1')
  })

  it('reintento con la misma Idempotency-Key; una comparación nueva tras completar usa otra key', async () => {
    const keys: string[] = []
    let calls = 0
    overrides.start = async (...args: unknown[]) => {
      calls += 1
      keys.push(args[2] as string)
      if (calls === 1) throw new ApiError('x', 422, 'c1', 'UNSUPPORTED_SYMBOL_KIND')
      return { status: 'PENDING', pollAfterMs: 10, analysisRunId: 'arun_checkout_pr49', retrievalComparisonId: `rcmp_retry_${calls}`, projectVersionId: 'ver_checkout_7' }
    }
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    await waitFor(() => expect(calls).toBe(2))
    expect(keys[0]).toBe(keys[1])
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('una previa cuyo detalle falla con 404 muestra alerta y no bloquea el resto de la página', async () => {
    overrides.start = async () => ({ status: 'PENDING', pollAfterMs: 10, analysisRunId: 'arun_checkout_pr49', retrievalComparisonId: 'rcmp_gone', projectVersionId: 'ver_checkout_7' })
    overrides.detail = async () => {
      throw new ApiError('no existe', 404, 'corr-gone', 'RETRIEVAL_COMPARISON_NOT_FOUND')
    }
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    await user.selectOptions(await screen.findByLabelText('Símbolo a comparar'), FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Esa comparación de retrieval ya no existe o no está disponible.')
    expect(screen.getByRole('list', { name: 'Comparaciones previas del Run' })).toBeInTheDocument()
  })
})

describe('WI-CONSOLE-017: descarga de evidencia en la comparación de retrieval', () => {
  it('no aparece antes de un estado terminal y sí al completarse la comparación', async () => {
    const user = userEvent.setup()
    renderPage(MULTI_RUN)
    const select = await screen.findByLabelText('Símbolo a comparar')
    await user.selectOptions(select, FORMAT_CURRENCY)
    await user.click(screen.getByRole('button', { name: 'Comparar retrieval SE vs SEM' }))
    expect(screen.queryByRole('button', { name: 'Descargar evidencia (JSON)' })).not.toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: /Resultado de/ }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar evidencia (JSON)' })).toBeInTheDocument()
  })
})
