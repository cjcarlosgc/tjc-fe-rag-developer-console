import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { clickGraphNode, renderApp } from '../test/render'
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

  expect(await screen.findByText('PR #45', { selector: '.pr-number' })).toBeInTheDocument()
  expect(screen.getByText('checkout-service')).toBeInTheDocument()
  expect(screen.getByText('feature/rounding-mode')).toBeInTheDocument()
  expect(await screen.findAllByText('AVAILABLE')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: /Publicar 3 propuesta\(s\)/ }))

  expect(await screen.findByText('Companion PR publicado')).toBeInTheDocument()
  expect(screen.getByText('rag-tests/pr-45-e5e5e5e')).toBeInTheDocument()
  expect(screen.getAllByText('feature/rounding-mode').length).toBeGreaterThanOrEqual(2)
  expect(screen.getByText(/Se mergea a la rama que ya vas a mergear/)).toBeInTheDocument()
  expect(screen.getAllByText('PUBLISHED')).toHaveLength(3)
})

test('HU32: un Run ACTION_REQUIRED enlaza a Focus Mode con returnTo de vuelta al Run', async () => {
  renderDetail('arun_checkout_pr42', 'prj_checkout_demo')

  const link = await screen.findByRole('link', { name: 'Abrir Focus Mode →' })
  expect(link).toHaveAttribute('href', `/action-required/arun_checkout_pr42?returnTo=${encodeURIComponent('/projects/prj_checkout_demo/runs/arun_checkout_pr42')}`)
})

test('HU48: un Run resuelto con símbolo elegible enlaza a Run comparison', async () => {
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  const link = await screen.findByRole('link', { name: /Run comparison/ })
  expect(link).toHaveAttribute('href', '/projects/prj_checkout_demo/runs/arun_checkout_pr45/comparison')
})

test('HU48: un Run ACTION_REQUIRED no ofrece Run comparison todavía', async () => {
  renderDetail('arun_checkout_pr42', 'prj_checkout_demo')

  await screen.findByRole('link', { name: 'Abrir Focus Mode →' })
  expect(screen.queryByRole('link', { name: /Run comparison/ })).not.toBeInTheDocument()
})

test('HU48: un Run sin símbolo METHOD/FUNCTION elegible no ofrece Run comparison', async () => {
  renderDetail('arun_billing_pr22', 'prj_billing_demo')

  await screen.findByText('No relevant changes', { selector: '.status-badge' })
  expect(screen.queryByRole('link', { name: /Run comparison/ })).not.toBeInTheDocument()
})

test('HU50 (especulativo): cada símbolo muestra su cobertura previa fabricada', async () => {
  renderDetail('arun_checkout_pr42', 'prj_checkout_demo')

  expect(await screen.findByText('sin cobertura previa')).toBeInTheDocument()
  expect(screen.getByText('cobertura previa parcial')).toBeInTheDocument()
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

test('el Run de PR#45 muestra el contexto RAG recolectado (grafo target→candidatos) y permite navegar nodos', async () => {
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  expect(await screen.findByText('Contexto recolectado')).toBeInTheDocument()
  expect(screen.getAllByText('calculateTotal').length).toBeGreaterThan(0)

  clickGraphNode(screen.getByRole('button', { name: /formatCurrency/ }))
  expect(await screen.findByRole('heading', { name: 'formatCurrency' })).toBeInTheDocument()
})

test('un Run sin traza de contexto mockeada no muestra la sección "Contexto recolectado"', async () => {
  renderDetail('arun_billing_pr17', 'prj_billing_demo')

  await screen.findByText('Run obsoleto')
  expect(screen.queryByText('Contexto recolectado')).not.toBeInTheDocument()
})

test('un Run INFRASTRUCTURE_FAILURE muestra el panel de fallo con resultSummary', async () => {
  renderDetail('arun_checkout_pr48', 'prj_checkout_demo')

  expect(await screen.findByRole('alert')).toHaveTextContent('La GitHub Compare API no respondió')
})

test('caso Bootstrap: un Run con indexMode BOOTSTRAP muestra el aviso de primer análisis', async () => {
  renderDetail('arun_billing_pr23', 'prj_billing_demo')

  expect(await screen.findByText('Primer análisis de este repositorio')).toBeInTheDocument()
  expect(screen.getByText(/se indexó el repositorio completo \(bootstrap\)/)).toBeInTheDocument()
})

test('un Run incremental normal no muestra el aviso de bootstrap', async () => {
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.queryByText('Primer análisis de este repositorio')).not.toBeInTheDocument()
})

test('caso PR grande: resume símbolos directos/impactados cuando el changeset es grande', async () => {
  renderDetail('arun_checkout_pr49', 'prj_checkout_demo')

  expect(await screen.findByText(/Changeset grande: 6 símbolo\(s\) con cambio directo, 8 potencialmente impactado\(s\)\./)).toBeInTheDocument()
})

test('un changeset chico no muestra el resumen de "changeset grande"', async () => {
  renderDetail('arun_checkout_pr45', 'prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.queryByText(/Changeset grande/)).not.toBeInTheDocument()
})

test('caso propuestas STALE: un intento anterior queda STALE y el vigente AVAILABLE', async () => {
  renderDetail('arun_checkout_pr50', 'prj_checkout_demo')

  expect(await screen.findByText('STALE')).toBeInTheDocument()
  expect(screen.getAllByText('AVAILABLE')).toHaveLength(2)
  expect(screen.getByRole('button', { name: /Publicar 2 propuesta\(s\)/ })).toBeInTheDocument()
})
