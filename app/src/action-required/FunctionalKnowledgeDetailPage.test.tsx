import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend, setMockFunctionalKnowledgeScenarioForTests } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { FunctionalKnowledgeDetailPage } from './FunctionalKnowledgeDetailPage'

const SHA_A = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderDetail(projectId: string, knowledgeId: string) {
  return renderApp(<FunctionalKnowledgeDetailPage />, { initialEntry: `/projects/${projectId}/functional-knowledge/${knowledgeId}`, routePath: '/projects/:projectId/functional-knowledge/:knowledgeId' })
}

function provenanceSection(): HTMLElement {
  return screen.getByRole('heading', { name: 'Procedencia' }).closest('section') as HTMLElement
}

test('HU07/HU09: detalle ACTIVE muestra pregunta, respuesta y escenario', async () => {
  renderDetail('prj_checkout_demo', 'fk_coupon_expiry')

  expect(await screen.findByRole('heading', { name: 'Un cupón vencido nunca debe aplicarse, incluso si el pedido ya está marcado como pagado.' })).toBeInTheDocument()
  expect(screen.getByText('¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?')).toBeInTheDocument()
  expect(screen.getByText('Excepción')).toBeInTheDocument()
  expect(screen.getByText('coupon.apply.expired-paid-order')).toBeInTheDocument()
  expect(screen.getByText('ACTIVE')).toBeInTheDocument()
})

test('HU07: procedencia de una regla confirmada: id de usuario, rol, sha corto con valor completo en title y fuente', async () => {
  renderDetail('prj_checkout_demo', 'fk_coupon_expiry')

  await screen.findByRole('heading', { name: 'Procedencia' })
  const section = provenanceSection()
  expect(within(section).getByText('usr_demo_admin')).toBeInTheDocument()
  expect(within(section).getByText('Admin')).toBeInTheDocument()
  expect(within(section).getByText('a1b2c3d')).toHaveAttribute('title', SHA_A)
  expect(within(section).getByText(`commit completo: ${SHA_A}`)).toHaveClass('visually-hidden')
  expect(within(section).getByText('Respuesta humana')).toBeInTheDocument()
  expect(within(section).queryByText('Referencia de importación')).not.toBeInTheDocument()
  expect(within(section).queryByText('sin procedencia registrada')).not.toBeInTheDocument()
})

test('HU07: una regla APPROVED_IMPORT muestra sourceRef; una HUMAN_ANSWER nunca lo muestra', async () => {
  renderDetail('prj_checkout_demo', 'fk_import_tax')

  const section = await screen.findByRole('heading', { name: 'Procedencia' }).then((heading) => heading.closest('section') as HTMLElement)
  expect(within(section).getByText('Importación aprobada')).toBeInTheDocument()
  expect(within(section).getByText('Referencia de importación')).toBeInTheDocument()
  expect(within(section).getByText('docs/reglas-negocio.md#L12')).toBeInTheDocument()
  expect(within(section).getByText('sin procedencia registrada')).toBeInTheDocument()
})

test('HU07: una regla histórica con campos null muestra «sin procedencia registrada» en cada campo ausente', async () => {
  renderDetail('prj_checkout_demo', 'fk_rounding_v1')

  await screen.findByRole('heading', { name: 'Procedencia' })
  const section = provenanceSection()
  expect(within(section).getAllByText('sin procedencia registrada')).toHaveLength(3)
  expect(within(section).queryByText('Referencia de importación')).not.toBeInTheDocument()
})

test('HU07/HU09: la cadena SUPERSEDED muestra los tres eslabones en orden y marca la regla actual', async () => {
  renderDetail('prj_checkout_demo', 'fk_rounding_v1')

  const chain = await screen.findByRole('list', { name: 'Cadena de reemplazo' })
  const links = within(chain).getAllByRole('listitem')
  expect(links).toHaveLength(3)
  expect(links[0]).toHaveTextContent('El total calculado conserva los decimales sin redondeo explícito.')
  expect(links[1]).toHaveTextContent('El total calculado trunca al centavo inferior; no redondea.')
  expect(links[1]).toHaveAttribute('aria-current', 'step')
  expect(within(links[1]).getByText('Estás viendo esta regla')).toBeInTheDocument()
  expect(within(links[1]).queryByText('Vigente')).not.toBeInTheDocument()
  expect(links[2]).toHaveTextContent('El total calculado redondea al centavo más cercano (no trunca).')
  expect(within(links[2]).getByText('Vigente')).toBeInTheDocument()
  expect(within(links[2]).queryByText('Estás viendo esta regla')).not.toBeInTheDocument()
  const links2 = within(chain).getAllByRole('link', { name: 'Ver regla →' })
  expect(links2).toHaveLength(2)
  expect(links2[0]).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v0?workspaceId=1000001')
  expect(links2[1]).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v2?workspaceId=1000001')
})

test('HU07/HU09: la cadena se recorre igual desde la raíz y desde la punta', async () => {
  renderDetail('prj_checkout_demo', 'fk_rounding_v2')

  const chain = await screen.findByRole('list', { name: 'Cadena de reemplazo' })
  expect(within(chain).getAllByRole('listitem')).toHaveLength(3)
  const current = within(chain).getAllByRole('listitem')[2]
  expect(current).toHaveAttribute('aria-current', 'step')
  expect(within(current).getByText('Estás viendo esta regla')).toBeInTheDocument()
  expect(within(current).getByText('Vigente')).toBeInTheDocument()
  expect(current.querySelector('a')).toBeNull()
})

test('HU07: una regla sin reemplazos no muestra la sección de cadena', async () => {
  renderDetail('prj_checkout_demo', 'fk_coupon_expiry')

  await screen.findByRole('heading', { name: 'Procedencia' })
  expect(screen.queryByRole('list', { name: 'Cadena de reemplazo' })).not.toBeInTheDocument()
})

test('HU07: una regla inexistente en el proyecto muestra «Regla no encontrada»', async () => {
  renderDetail('prj_checkout_demo', 'fk_no_existe')

  expect(await screen.findByText('Regla no encontrada')).toBeInTheDocument()
})

test('HU07: un proyecto inexistente muestra el error con role="alert"', async () => {
  renderDetail('prj_no_existe', 'fk_coupon_expiry')

  expect(await screen.findByRole('alert')).toHaveTextContent('No existe el proyecto demo')
})

test('HU52 (propuesta): lista los Analysis Runs cuyo símbolo coincide con el target de la regla', async () => {
  renderDetail('prj_checkout_demo', 'fk_coupon_expiry')

  expect(await screen.findByText('Runs que usaron esta regla')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'PR #42' })).toHaveAttribute('href', '/projects/prj_checkout_demo/runs/arun_checkout_pr42')
  expect(screen.getByRole('link', { name: 'PR #46' })).toHaveAttribute('href', '/projects/prj_checkout_demo/runs/arun_checkout_pr46')
})

test('HU52 (propuesta): sin coincidencias muestra el estado vacío en vez de la lista', async () => {
  renderDetail('prj_billing_demo', 'fk_discount_engine')

  expect(await screen.findByText('Runs que usaron esta regla')).toBeInTheDocument()
  expect(screen.getByText('Ningún Analysis Run demo tocó este símbolo todavía.')).toBeInTheDocument()
})

test('INTEROP-2.7 §6.11: escenario nulo o clave LEGACY muestran estado vacío, no la clave ni «Otros»', async () => {
  setMockFunctionalKnowledgeScenarioForTests('fk_rounding_v1', { scenarioKind: null, scenarioKey: 'LEGACY' })
  renderDetail('prj_checkout_demo', 'fk_rounding_v1')

  await screen.findByRole('heading', { name: 'Procedencia' })
  const dl = screen.getByText('Clave de escenario').closest('dl') as HTMLElement
  expect(within(dl).getByText('sin escenario registrado')).toBeInTheDocument()
  expect(within(dl).getByText('sin clave de escenario (regla histórica)')).toBeInTheDocument()
  expect(within(dl).queryByText('LEGACY')).not.toBeInTheDocument()
  expect(within(dl).queryByText('Otros')).not.toBeInTheDocument()
})
