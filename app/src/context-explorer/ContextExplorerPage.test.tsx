import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockStartExperiment, resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { ContextExplorerPage } from './ContextExplorerPage'

const ROUTE = '/projects/:projectId/runs/:runId/context'
const RUN_ENTRY = '/projects/prj_checkout_demo/runs/run_checkout_seed/context'
const EXPERIMENT_ROUTE = '/projects/:projectId/experimental/:experimentId/context'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => setDataSourceForTests(null))

describe('ContextExplorerPage', () => {
  it('muestra por defecto el último intento del primer target con su grafo RAG', async () => {
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    expect(await screen.findByRole('button', { name: /calculateTotal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /formatCurrency/ })).toBeInTheDocument()
  })

  it('alterna entre vista de grafo y vista de lista manteniendo el mismo conteo de nodos', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    const graphNodeCount = screen.getAllByRole('button').filter((button) => button.className.includes('graph-node')).length

    await user.click(screen.getByRole('button', { name: 'Vista de lista' }))
    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(graphNodeCount)
  })

  it('seleccionar un candidato actualiza el panel lateral con su detalle', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    await user.click(screen.getByRole('button', { name: /formatCurrency/ }))
    const panel = screen.getByRole('complementary', { name: 'Detalle del candidato' })
    expect(within(panel).getByText('Hash del contenido')).toBeInTheDocument()
    expect(within(panel).getByText(/no representa una probabilidad/)).toBeInTheDocument()
  })

  it('incluir intentos anteriores habilita el selector de intento', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    await user.click(screen.getByRole('checkbox', { name: /Incluir intentos anteriores/ }))
    expect(await screen.findByRole('button', { name: /Intento 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Intento 2 · vigente/ })).toBeInTheDocument()
  })

  it('la búsqueda filtra candidatos por símbolo/archivo (spec.md: búsqueda y filtros)', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    expect(screen.getByRole('button', { name: /CouponPolicy/ })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar nodo, símbolo o hash'), 'formatCurrency')
    expect(screen.getByRole('button', { name: /formatCurrency/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /CouponPolicy/ })).not.toBeInTheDocument()
  })

  it('el filtro de señal semántica oculta candidatos de otra señal', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    expect(screen.getByRole('button', { name: /^OrderService/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Semántica' }))
    expect(screen.queryByRole('button', { name: /^OrderService/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /CouponPolicy/ })).toBeInTheDocument()
  })

  it('desmarcar "Descartados" oculta los candidatos descartados', async () => {
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, { initialEntry: RUN_ENTRY, routePath: ROUTE })
    await screen.findByRole('button', { name: /calculateTotal/ })
    expect(screen.getByRole('button', { name: /createLogger/ })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Descartados/ }))
    expect(screen.queryByRole('button', { name: /createLogger/ })).not.toBeInTheDocument()
  })

  it('muestra un estado vacío cuando el run no tiene trazas de contexto', async () => {
    renderApp(<ContextExplorerPage />, { initialEntry: '/projects/prj_checkout_demo/runs/run_sin_contexto/context', routePath: ROUTE })
    expect(await screen.findByText('Sin trazas de contexto')).toBeInTheDocument()
  })

  it('el deep link con strategy/repetition selecciona la traza AGENT correcta de un experimento (HU28)', async () => {
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    renderApp(<ContextExplorerPage />, {
      initialEntry: `/projects/prj_checkout_demo/experimental/${accepted.experimentId}/context?strategy=GENERALIST_AGENT&repetition=2`,
      routePath: EXPERIMENT_ROUTE,
    })
    expect(await screen.findByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agente · rep 2/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambia de renderer limpiamente al alternar entre un trace RAG y uno AGENT del mismo experimento (HU28)', async () => {
    const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
    const user = userEvent.setup()
    renderApp(<ContextExplorerPage />, {
      initialEntry: `/projects/prj_checkout_demo/experimental/${accepted.experimentId}/context?strategy=RAG&repetition=1`,
      routePath: EXPERIMENT_ROUTE,
    })
    expect(await screen.findByRole('button', { name: /calculateTotal/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Agente · rep 1/ }))
    expect(await screen.findByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calculateTotal/ })).not.toBeInTheDocument()
  })

  it('mientras la traza todavía se procesa (409) muestra el loader auditado, nunca un error (HU27)', async () => {
    renderApp(<ContextExplorerPage />, { initialEntry: `${RUN_ENTRY}?trace=trace_rag_coupon`, routePath: ROUTE })
    expect(await screen.findByText(/La traza todavía se está procesando/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /CouponPolicy/ })).toBeInTheDocument()
  })
})
