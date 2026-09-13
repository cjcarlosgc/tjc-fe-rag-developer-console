import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { AnalysisRunDetailPage } from './AnalysisRunDetailPage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderDetail(analysisRunId: string, projectId: string) {
  return renderApp(<AnalysisRunDetailPage />, { initialEntry: `/projects/${projectId}/runs/${analysisRunId}`, routePath: '/projects/:projectId/runs/:analysisRunId' })
}

test('HU39/HU40: un Run SUCCESS lista propuestas AVAILABLE y publica un companion PR', async () => {
  const user = userEvent.setup()
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByText('acme/checkout-service · PR #45')).toBeInTheDocument()
  expect(await screen.findAllByText('AVAILABLE')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: /Publicar 3 propuesta\(s\)/ }))

  expect(await screen.findByText('Companion PR publicado')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /PR #145 en acme\/checkout-service/ })).toHaveAttribute('href', 'https://github.com/acme/checkout-service/pull/145')
  expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)
})

test('HU32: un Run ACTION_REQUIRED enlaza a Focus Mode con returnTo de vuelta al Run', async () => {
  renderDetail('arun_checkout_pr42', 'prj_checkout_demo')

  const link = await screen.findByRole('link', { name: 'Abrir Focus Mode →' })
  expect(link).toHaveAttribute('href', `/action-required/arun_checkout_pr42?returnTo=${encodeURIComponent('/projects/prj_checkout_demo/runs/arun_checkout_pr42')}`)
})

test('HU32: un Run OBSOLETE muestra el aviso de HEAD nuevo sin acciones', async () => {
  renderDetail('arun_billing_pr17', 'prj_billing_demo')

  expect(await screen.findByText('Run obsoleto')).toBeInTheDocument()
  expect(screen.getByText(/HEAD nuevo llegó a PR#17/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
})

test('HU39: un Run BEHAVIORAL_MISMATCH mantiene sus propuestas HELD, sin botón de publicar', async () => {
  renderDetail('arun_checkout_pr46', 'prj_checkout_demo')

  expect(await screen.findAllByText('Behavioral mismatch')).not.toHaveLength(0)
  expect(screen.getByText('HELD')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
})

test('un Run BASELINE_FAILED muestra el panel de fallo con resultSummary', async () => {
  renderDetail('arun_billing_pr20', 'prj_billing_demo')

  expect(await screen.findByRole('alert')).toHaveTextContent('La suite existente ya falla')
})
