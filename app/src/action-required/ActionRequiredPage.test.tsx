import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { ActionRequiredPage } from './ActionRequiredPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

test('HU38: lista los Runs con contexto funcional pendiente y enlaza a Focus Mode con returnTo', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required' })

  expect(await screen.findAllByText('checkout-service', { selector: '.repo-name' })).toHaveLength(2)
  expect(screen.getByText('PR #42', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getAllByText('billing-engine', { selector: '.repo-name' }).length).toBe(2)
  expect(screen.getByText('PR #17', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getByText('PR #24', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getByText('PR #52', { selector: '.pr-ref' })).toBeInTheDocument()

  const links = await screen.findAllByRole('link')
  const link = links.find((item) => item.textContent?.includes('CouponPolicy.apply'))
  expect(link).toHaveAttribute('href', `/action-required/arun_checkout_pr42?returnTo=${encodeURIComponent('/action-required')}`)
})

test('filtra la bandeja por workspace sin mezclar pendientes de otras organizaciones', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required?workspaceId=2000002' })
  expect(await screen.findByText('PR #15', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.queryByText('PR #42', { selector: '.pr-ref' })).not.toBeInTheDocument()
})

test('INTEROP-2.7: la bandeja muestra la abstención registrada sin identidad de quien se abstuvo', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required' })

  expect(await screen.findByText(/Abstención registrada · ADMIN · .+ · 2 abstención\(es\)/)).toBeInTheDocument()
  expect(screen.getByText('¿"applyLateFee" debe aplicarse si la factura ya fue marcada como pagada parcialmente?')).toBeInTheDocument()
  expect(screen.queryByText(/usr_demo/)).not.toBeInTheDocument()
  expect(screen.queryByText(/resuelto|continuando|todas las preguntas respondidas/i)).not.toBeInTheDocument()
})

test('INTEROP-2.7: una abstención mantiene la pregunta en la bandeja, sin texto de cierre ni identidad', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required' })

  const line = await screen.findByText(/Abstención registrada · ADMIN · .+ · 2 abstención\(es\)/)
  expect(line).toHaveClass('abstention-note')
  expect(line.closest('.action-required-item')).toHaveTextContent('¿"applyLateFee" debe aplicarse si la factura ya fue marcada como pagada parcialmente?')
  expect(screen.queryByText(/usr_/)).not.toBeInTheDocument()
  expect(screen.queryByText(/resuelto|continuando|todas las preguntas respondidas/i)).not.toBeInTheDocument()
})

test('Writer y Reader ven la bandeja sin botones de respuesta ni «No lo sé»', async () => {
  renderApp(<ActionRequiredPage />, { initialEntry: '/action-required' })

  expect(await screen.findByText('PR #21', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.getByText('PR #15', { selector: '.pr-ref' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'No lo sé' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Sí' })).not.toBeInTheDocument()
})
