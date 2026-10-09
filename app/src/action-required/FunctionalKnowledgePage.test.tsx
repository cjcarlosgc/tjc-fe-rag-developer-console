import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { FunctionalKnowledgePage } from './FunctionalKnowledgePage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderPage(projectId: string) {
  return renderApp(<FunctionalKnowledgePage />, { initialEntry: `/projects/${projectId}/functional-knowledge`, routePath: '/projects/:projectId/functional-knowledge' })
}

function groupHeadings(): string[] {
  return screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent ?? '')
}

test('HU07/HU09: agrupa las reglas por escenario en el orden de INTEROP-2.7 y omite grupos vacíos', async () => {
  renderPage('prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  expect(groupHeadings()).toEqual(['Resultado esperado', 'Borde', 'Excepción', 'Precondición funcional'])
  expect(screen.queryByRole('heading', { name: 'Transición de estado' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Efecto observable' })).not.toBeInTheDocument()
})

test('HU09: muestra varias reglas ACTIVE sobre el mismo target, cada una con su escenario', async () => {
  renderPage('prj_checkout_demo')

  expect(await screen.findByText('Un carrito sin líneas produce un total de 0,00 sin lanzar error.')).toBeInTheDocument()
  expect(screen.getAllByText('OrderService.calculateTotal')).toHaveLength(4)
  const expectedGroup = screen.getByRole('heading', { name: 'Resultado esperado' }).closest('section') as HTMLElement
  expect(within(expectedGroup).getByText('order.calculateTotal.empty-cart')).toBeInTheDocument()
})

test('HU35/HU36: badges ACTIVE y SUPERSEDED con su texto, conteo literal en prj_checkout_demo', async () => {
  renderPage('prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  expect(screen.getAllByText('ACTIVE')).toHaveLength(5)
  expect(screen.getAllByText('SUPERSEDED')).toHaveLength(2)
})

test('HU35/HU36: el filtro Active recalcula los grupos y oculta las SUPERSEDED', async () => {
  const user = userEvent.setup()
  renderPage('prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  await user.click(screen.getByRole('button', { name: 'Active' }))

  expect(screen.queryByText('SUPERSEDED')).not.toBeInTheDocument()
  expect(screen.getAllByText('ACTIVE')).toHaveLength(5)
  expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true')
  expect(groupHeadings()).toEqual(['Resultado esperado', 'Borde', 'Excepción', 'Precondición funcional'])
})

test('HU35/HU36: el filtro Superseded deja solo la cadena reemplazada y el grupo Borde', async () => {
  const user = userEvent.setup()
  renderPage('prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  await user.click(screen.getByRole('button', { name: 'Superseded' }))

  expect(screen.getAllByText('SUPERSEDED')).toHaveLength(2)
  expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument()
  expect(groupHeadings()).toEqual(['Borde'])
})

test('HU35/HU36: un filtro sin reglas muestra el estado vacío', async () => {
  const user = userEvent.setup()
  renderPage('prj_org_orders_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  await user.click(screen.getByRole('button', { name: 'Superseded' }))

  expect(await screen.findByText('Sin reglas')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Sin reglas')
  expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
})

test('HU35/HU36: el vacío tras filtrar vive en una región role="status" que se mantiene montada', async () => {
  const user = userEvent.setup()
  renderPage('prj_org_orders_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  const status = screen.getByRole('status')
  expect(status).toBeEmptyDOMElement()
  await user.click(screen.getByRole('button', { name: 'Superseded' }))

  expect(await screen.findByText('Sin reglas')).toBeInTheDocument()
  expect(screen.getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('Sin reglas')
})

test('HU07: la clave de escenario se etiqueta «Clave de escenario» en cada tarjeta', async () => {
  renderPage('prj_checkout_demo')

  await screen.findByRole('heading', { name: 'Resultado esperado' })
  expect(screen.queryByText(/Escenario clave/)).not.toBeInTheDocument()
  expect(screen.getAllByText('Clave de escenario')).toHaveLength(7)
})

test('carga: muestra el estado de carga con role="status" antes de la respuesta', () => {
  renderPage('prj_checkout_demo')

  expect(screen.getByRole('status')).toHaveTextContent('Cargando reglas…')
})

test('error: un proyecto inexistente muestra el error con role="alert" y reintento', async () => {
  renderPage('prj_no_existe')

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No existe el proyecto demo "prj_no_existe".')
  expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
})

test('live: sin contrato publicado, la lista muestra el error de contrato pendiente de INTEROP-2.7', async () => {
  setDataSourceForTests('live')
  renderPage('prj_checkout_demo')

  expect(await screen.findByText(/todavía no publicó el contrato live para las reglas de Functional Knowledge/)).toBeInTheDocument()
  expect(screen.queryByText('DEMO · DATOS SIMULADOS')).not.toBeInTheDocument()
})

describe('HU07/HU09: la lectura no depende del rol y no ofrece acciones de edición', () => {
  test.each([
    ['ADMIN', 'prj_checkout_demo'],
    ['MAINTAINER', 'prj_org_orders_demo'],
    ['WRITER', 'prj_org_writer_demo'],
    ['READER', 'prj_org_metrics_demo'],
  ])('%s (%s) ve la misma estructura y solo los tres filtros como botones', async (_role, projectId) => {
    renderPage(projectId)

    await screen.findAllByRole('heading', { level: 2 })
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Todas', 'Active', 'Superseded'])
    expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar|eliminar|confirmar|guardar/i })).not.toBeInTheDocument()
  })
})
