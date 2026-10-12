import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockStartExperiment, resetMockBackend } from '../api/mockBackend'
import { clickGraphNode, renderApp } from '../test/render'
import { ContextExplorerPage } from './ContextExplorerPage'

const EXPERIMENT_ROUTE = '/projects/:projectId/experimental/:experimentId/context'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => setDataSourceForTests(null))

async function renderExperiment(search = '') {
  const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
  renderApp(<ContextExplorerPage />, {
    initialEntry: `/projects/prj_checkout_demo/experimental/${accepted.experimentId}/context${search}`,
    routePath: EXPERIMENT_ROUTE,
  })
}

// El efecto que fija el nodo por defecto (setSearchParams) puede asentarse después del primer findBy; esperar a la selección evita pisar un clic de toggle.
async function waitForDefaultSelection() {
  await waitFor(() => expect(screen.getAllByRole('button').some((button) => button.className.includes('graph-node') && button.getAttribute('aria-pressed') === 'true')).toBe(true))
}

describe('ContextExplorerPage', () => {
  it('muestra por defecto la traza RAG del experimento', async () => {
    await renderExperiment()
    expect(await screen.findByRole('button', { name: /calculateTotal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /RAG · rep 1/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('alterna entre vista de grafo y lista conservando los nodos', async () => {
    const user = userEvent.setup()
    await renderExperiment()
    await screen.findByRole('button', { name: /calculateTotal/ })
    await waitForDefaultSelection()
    const graphNodeCount = screen.getAllByRole('button').filter((button) => button.className.includes('graph-node')).length

    await user.click(screen.getByRole('button', { name: 'Vista de lista' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Vista de lista' })).toHaveAttribute('aria-pressed', 'true'))
    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(graphNodeCount)
  })

  it('seleccionar un candidato actualiza el panel lateral', async () => {
    await renderExperiment()
    await screen.findByRole('button', { name: /calculateTotal/ })
    clickGraphNode(screen.getByRole('button', { name: /formatCurrency/ }))
    const panel = await screen.findByRole('complementary', { name: 'Detalle del candidato' })
    expect(within(panel).getByText('Hash del contenido')).toBeInTheDocument()
    expect(within(panel).getByText(/no representa una probabilidad/)).toBeInTheDocument()
  })

  it('el deep link elige la repetición y estrategia indicadas', async () => {
    await renderExperiment('?strategy=GENERALIST_AGENT&repetition=2')
    expect(await screen.findByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agente · rep 2/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambia el renderer al alternar entre una traza RAG y una AGENT', async () => {
    const user = userEvent.setup()
    await renderExperiment('?strategy=RAG&repetition=1')
    expect(await screen.findByRole('button', { name: /calculateTotal/ })).toBeInTheDocument()
    await waitForDefaultSelection()
    await user.click(screen.getByRole('button', { name: /Agente · rep 1/ }))
    expect(await screen.findByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calculateTotal/ })).not.toBeInTheDocument()
  })
})
