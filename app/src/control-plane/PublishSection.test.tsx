import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import * as controlPlaneApi from './api'
import { AnalysisRunDetailPage } from './AnalysisRunDetailPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderDetail(analysisRunId: string, projectId: string) {
  return renderApp(<AnalysisRunDetailPage />, { initialEntry: `/projects/${projectId}/runs/${analysisRunId}`, routePath: '/projects/:projectId/runs/:analysisRunId' })
}

/** Registra cada texto que el region role=status toma, para observar PENDING → PUBLISHING → terminal. */
/** Región de progreso de la publicación (la página tiene otras regiones role=status). */
function publicationRegion(): HTMLElement {
  const region = screen.getAllByRole('status').find((element) => /Publicación (en curso|finalizada)|Publicando/.test(element.textContent ?? '') || element.classList.contains('publication-status'))
  if (!region) throw new Error('Sin región de progreso de publicación')
  return region
}

function recordStatusRegion(): { seen: string[]; stop: () => void } {
  const region = publicationRegion()
  const seen: string[] = []
  const observer = new MutationObserver(() => seen.push(region.textContent ?? ''))
  observer.observe(region, { childList: true, characterData: true, subtree: true })
  return { seen, stop: () => observer.disconnect() }
}

test('WI-CONSOLE-032: PENDING → PUBLISHING → PUBLISHED con enlace seguro y sin segundo POST', async () => {
  const user = userEvent.setup()
  const createSpy = vi.spyOn(controlPlaneApi, 'createTestPublication')
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')
  await screen.findAllByText('AVAILABLE')
  const recorder = recordStatusRegion()

  const button = screen.getByRole('button', { name: /Publicar 3 propuesta\(s\)/ })
  await user.click(button)
  // Mientras la publicación no es terminal el botón conserva foco y queda con aria-disabled; el clic no envía otro POST.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Publicando…' })).toHaveAttribute('aria-disabled', 'true'))
  const busyButton = screen.getByRole('button', { name: 'Publicando…' })
  expect(busyButton).not.toBeDisabled()
  await user.click(busyButton)
  expect(createSpy).toHaveBeenCalledTimes(1)

  expect(await screen.findByText('Companion PR publicado')).toBeInTheDocument()
  recorder.stop()
  expect(recorder.seen).toEqual(expect.arrayContaining([expect.stringContaining('PENDING…'), expect.stringContaining('PUBLISHING…')]))
  expect(publicationRegion()).toHaveTextContent('Publicación finalizada: PUBLISHED')

  const link = screen.getByRole('link', { name: /Abrir en GitHub/ })
  expect(link).toHaveAttribute('href', 'https://github.com/acme/checkout-service/pull/145')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText('PR companion #145', { exact: false })).toBeInTheDocument()
  expect(screen.getByText('rag-tests/pr-45-e5e5e5e')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
  expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)
})

test('WI-CONSOLE-032: FAILED muestra role=alert con failureMessage y sin botón de reintento', async () => {
  const user = userEvent.setup()
  renderDetail('arun_checkout_pr49', 'prj_checkout_demo')
  await user.click(await screen.findByRole('button', { name: /Publicar 4 propuesta\(s\)/ }))

  const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
  expect(within(alert).getByText('Publicación fallida')).toBeInTheDocument()
  expect(within(alert).getByText(/DEMO · DATOS SIMULADOS/)).toBeInTheDocument()
  expect(publicationRegion()).toHaveTextContent('Publicación finalizada: FAILED')
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Abrir en GitHub/ })).not.toBeInTheDocument()
})

test('WI-CONSOLE-032: STALE muestra role=alert explicando que el HEAD cambió, sin reintento', async () => {
  const user = userEvent.setup()
  renderDetail('arun_billing_pr17_2', 'prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: /Publicar 2 propuesta\(s\)/ }))

  const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
  expect(within(alert).getByText('Publicación obsoleta (STALE)')).toBeInTheDocument()
  expect(within(alert).getByText(/El HEAD del PR cambió y el Run vigente es otro/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
})

test('WI-CONSOLE-032: tras recargar, propuestas ya PUBLISHED sin publicationId muestran el aviso sin enlace', async () => {
  const user = userEvent.setup()
  const { unmount } = renderDetail('arun_checkout_pr45', 'prj_checkout_demo')
  await user.click(await screen.findByRole('button', { name: /Publicar 3 propuesta\(s\)/ }))
  expect(await screen.findByText('Companion PR publicado')).toBeInTheDocument()
  unmount()

  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')
  expect(await screen.findByText('Las propuestas ya fueron publicadas en un companion PR.')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Abrir en GitHub/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
})

test('WI-CONSOLE-032 (corrección UX 1): FAILED muestra siguiente paso, clase de desborde y mueve el foco desde el botón desaparecido a la región de resultado', async () => {
  const user = userEvent.setup()
  renderDetail('arun_checkout_pr49', 'prj_checkout_demo')
  const button = await screen.findByRole('button', { name: /Publicar 4 propuesta\(s\)/ })
  await user.click(button)
  expect(button).toHaveFocus()

  const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
  expect(alert).toHaveClass('publication-alert')
  expect(within(alert).getByText(/Revisa el motivo; Core no reintenta automáticamente/)).toBeInTheDocument()
  expect(within(alert).getByText(/espera el siguiente HEAD del PR/)).toBeInTheDocument()
  const region = alert.closest('.publication-result') as HTMLElement
  expect(region).toHaveAttribute('tabindex', '-1')
  await waitFor(() => expect(document.activeElement).toBe(region))
})

test('WI-CONSOLE-032 (corrección UX 1): STALE indica abrir el Run vigente del Pull Request', async () => {
  const user = userEvent.setup()
  renderDetail('arun_billing_pr17_2', 'prj_billing_demo')
  await user.click(await screen.findByRole('button', { name: /Publicar 2 propuesta\(s\)/ }))

  const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
  expect(within(alert).getByText(/abre el Run vigente del Pull Request para publicar sus propuestas/)).toBeInTheDocument()
  expect(alert).toHaveClass('publication-alert')
})
