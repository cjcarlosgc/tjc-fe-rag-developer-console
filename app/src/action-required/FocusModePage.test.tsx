import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { FocusModePage } from './FocusModePage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderFocusMode(analysisRunId: string, returnTo = '/action-required') {
  return renderApp(<FocusModePage />, {
    initialEntry: `/action-required/${analysisRunId}?returnTo=${encodeURIComponent(returnTo)}`,
    routePath: '/action-required/:analysisRunId',
  })
}

test('HU37: muestra la pregunta vigente con su visualAid y avanza a la siguiente al responder', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr42')

  expect(await screen.findByText('¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?')).toBeInTheDocument()
  expect(screen.getByText('CouponPolicy.ts — cambio en apply')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Sí' }))

  expect(await screen.findByText('¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?')).toBeInTheDocument()
})

test('HU37: "No lo sé" (UNKNOWN) también avanza, sin prometer conocimiento persistido', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr42')

  await screen.findByText('¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?')
  await user.click(screen.getByRole('button', { name: 'No lo sé' }))

  expect(await screen.findByText('¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?')).toBeInTheDocument()
})

test('HU37: al agotar las preguntas del Run, confirma el contexto y permite volver a returnTo', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr42', '/action-required')

  await screen.findByText('¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?')
  await user.click(screen.getByRole('button', { name: 'Sí' }))
  await screen.findByText('¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?')
  await user.click(screen.getByRole('button', { name: 'No' }))

  expect(await screen.findByText('Contexto funcional confirmado')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/action-required')
})

test('HU36/HU37: si el HEAD cambió, tras responder el Run no se reanuda', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_billing_pr17')

  await screen.findByText('¿"DiscountEngine.applyDiscount" puede dejar el total en negativo si el cupón excede el subtotal?')
  await user.click(screen.getByRole('button', { name: 'Sí' }))

  expect(await screen.findByText('Sin preguntas pendientes en este Run')).toBeInTheDocument()
})

test('HU38: valida "returnTo" externo como interno inseguro y cae al valor por defecto', async () => {
  renderFocusMode('arun_billing_pr17', '//evil.example/phish')
  await screen.findByText('¿"DiscountEngine.applyDiscount" puede dejar el total en negativo si el cupón excede el subtotal?')
  expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/action-required')
})

test('HU51 (INTEROP-2.1 §6.11, definido/no implementado): responder muestra el conflicto con la regla vigente', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr52')

  await screen.findByText(/¿"validate" debe aceptar direcciones/)
  await user.click(screen.getByRole('button', { name: 'Sí' }))

  expect(await screen.findByText('Esta respuesta contradice una regla vigente')).toBeInTheDocument()
  expect(screen.getByText('Ninguna dirección fuera de las zonas de envío habilitadas debe pasar "validate", sin excepciones por tipo de cliente.')).toBeInTheDocument()
})

test('HU51: "Reemplazar regla vigente" (SUPERSEDE) persiste la respuesta y avanza el Run', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr52')

  await screen.findByText(/¿"validate" debe aceptar direcciones/)
  await user.click(screen.getByRole('button', { name: 'Sí' }))
  await screen.findByText('Esta respuesta contradice una regla vigente')

  await user.click(screen.getByRole('button', { name: 'Reemplazar regla vigente' }))

  expect(await screen.findByText('Contexto funcional confirmado')).toBeInTheDocument()
})

test('HU51: "Mantener la vigente" (KEEP_EXISTING) avanza sin tocar la regla', async () => {
  const user = userEvent.setup()
  renderFocusMode('arun_checkout_pr52')

  await screen.findByText(/¿"validate" debe aceptar direcciones/)
  await user.click(screen.getByRole('button', { name: 'No' }))
  await screen.findByText('Esta respuesta contradice una regla vigente')

  await user.click(screen.getByRole('button', { name: 'Mantener la vigente, guardar como evidencia' }))

  expect(await screen.findByText('Contexto funcional confirmado')).toBeInTheDocument()
})
