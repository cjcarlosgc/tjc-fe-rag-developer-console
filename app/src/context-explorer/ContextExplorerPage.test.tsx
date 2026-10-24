import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useLocation } from 'react-router-dom'
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
    await user.click(screen.getByRole('button', { name: /Agente · rep 1/ }))
    expect(await screen.findByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calculateTotal/ })).not.toBeInTheDocument()
  })
})

// --- WI-CONSOLE-036 corte A (B1): breadcrumb de vuelta conserva experimentId y analysisRunId ---
it('WI-CONSOLE-036 B1: el breadcrumb «Modo experimental» conserva experimentId y analysisRunId', async () => {
  const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
  renderApp(<ContextExplorerPage />, {
    initialEntry: `/projects/prj_checkout_demo/experimental/${accepted.experimentId}/context?analysisRunId=arun-1`,
    routePath: EXPERIMENT_ROUTE,
  })
  const link = await screen.findByRole('link', { name: 'Modo experimental' })
  const target = new URL(link.getAttribute('href') ?? '', 'http://localhost')
  expect(target.pathname).toBe('/projects/prj_checkout_demo/experimental')
  expect(target.searchParams.get('experimentId')).toBe(accepted.experimentId)
  expect(target.searchParams.get('analysisRunId')).toBe('arun-1')
})

// --- WI-CONSOLE-037 F1: composición de escrituras de URL desde la URL vigente, no desde el snapshot del render ---
function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-search">{location.search}</output>
}

it('WI-CONSOLE-037 F1: dos escrituras de URL en el mismo ciclo (nodo y vista) no se pisan', async () => {
  const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
  renderApp(
    <>
      <ContextExplorerPage />
      <LocationProbe />
    </>,
    {
      initialEntry: `/projects/prj_checkout_demo/experimental/${accepted.experimentId}/context`,
      routePath: EXPERIMENT_ROUTE,
    },
  )
  await screen.findByRole('button', { name: /calculateTotal/ })
  const readParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
  // Precondición: el efecto de nodo por defecto ya escribió `node` en la URL (no basta con que el nodo aparezca pulsado).
  await waitFor(() => expect(readParams().get('node')).not.toBeNull())
  const defaultNode = readParams().get('node')

  // Ambos clics ocurren antes de que React re-renderice: la segunda escritura debe partir de la URL ya escrita por la primera.
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /formatCurrency/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Vista de lista' }))
  })

  expect(readParams().get('view')).toBe('list')
  expect(readParams().get('node')).not.toBe(defaultNode)
  expect(readParams().get('node')).not.toBeNull()
})
