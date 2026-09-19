import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { FunctionalKnowledgeDetailPage } from './FunctionalKnowledgeDetailPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderDetail(projectId: string, knowledgeId: string) {
  return renderApp(<FunctionalKnowledgeDetailPage />, { initialEntry: `/projects/${projectId}/functional-knowledge/${knowledgeId}`, routePath: '/projects/:projectId/functional-knowledge/:knowledgeId' })
}

test('HU35/HU36: detalle ACTIVE simple muestra pregunta, respuesta y metadata', async () => {
  renderDetail('prj_checkout_demo', 'fk_coupon_expiry')

  expect(await screen.findByText('Un cupón vencido nunca debe aplicarse, incluso si el pedido ya está marcado como pagado.')).toBeInTheDocument()
  expect(screen.getByText('¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?')).toBeInTheDocument()
  expect(screen.getAllByText('CouponPolicy.apply').length).toBeGreaterThan(0)
  expect(screen.getByText('Respuesta humana')).toBeInTheDocument()
  expect(screen.getByText('ACTIVE')).toBeInTheDocument()
})

test('HU35/HU36: la regla SUPERSEDED enlaza a la que la reemplaza y viceversa', async () => {
  renderDetail('prj_checkout_demo', 'fk_rounding_v1')

  expect(await screen.findByText('SUPERSEDED')).toBeInTheDocument()
  expect(screen.getByText('Reemplazada por')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: 'Ver regla vigente →' })
  expect(link).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v2')
})

test('HU35/HU36: la regla ACTIVE vigente enlaza hacia atrás a la regla que reemplazó', async () => {
  renderDetail('prj_checkout_demo', 'fk_rounding_v2')

  expect(await screen.findByText('Reemplaza a una regla anterior')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: 'Ver regla reemplazada →' })
  expect(link).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge/fk_rounding_v1')
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
