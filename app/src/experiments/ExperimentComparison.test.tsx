import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { ExperimentComparison } from './ExperimentComparison'
import type { ExperimentResultViewModel } from './types'

const result: ExperimentResultViewModel = { baseline: { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .6, executionRate: .5, passedRate: .5, totalDurationMs: 1000, totalTokens: 100, estimatedCost: .01, failures: { COMPILATION: 2 } }, rag: { strategy: 'RAG', validRate: .75, compilationRate: .8, executionRate: .75, passedRate: .75, totalDurationMs: 1500, totalTokens: 160, estimatedCost: .02, failures: { COMPILATION: 1 }, retrievedChunks: 20, selectedChunks: 6, contextTokens: 1200 }, repetitions: [{ target: 'Cart.total', repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 500, totalTokens: 50, errorSummary: null }] }

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('calcula diferencia de tasas en puntos porcentuales', () => {
  renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  expect(screen.getByText('Agente generalista')).toBeInTheDocument()
  expect(screen.getByText('Explora sus propias referencias')).toBeInTheDocument()
  expect(screen.getAllByText('+25.0 pp').length).toBeGreaterThan(0)
})

test('presenta diferencias absolutas y relativas para tiempo, tokens y costo', () => {
  renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  expect(screen.getByText('Δ +500 ms · +50%')).toBeInTheDocument()
  expect(screen.getByText('Δ +60 · +60%')).toBeInTheDocument()
  expect(screen.getByText('Δ +0.0100 USD · +100%')).toBeInTheDocument()
})

test('presenta retrieval únicamente como explicación RAG', () => {
  renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  expect(screen.getByText('Huella de retrieval')).toBeInTheDocument()
  expect(screen.getByText('20 chunks')).toBeInTheDocument()
})

test('permite abrir la trazabilidad por repetición', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  expect(screen.getByText('Cart.total')).toBeVisible()
})

test('muestra el mensaje de error de la repetición cuando falla por configuración del proyecto', async () => {
  const user = userEvent.setup()
  const failed: ExperimentResultViewModel = { ...result, repetitions: [{ target: 'Cart.total', repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'COMPILATION', durationMs: 500, totalTokens: 50, errorSummary: 'jest.config.js: Cannot find module ts-jest' }] }
  renderWithRouter(<ExperimentComparison result={failed} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  expect(screen.getByText('jest.config.js: Cannot find module ts-jest')).toBeVisible()
})

test('el link "Ver contexto" de cada repetición apunta al explorador con strategy/repetition', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  expect(screen.getByRole('link', { name: /Ver contexto/ })).toHaveAttribute('href', '/projects/prj1/experimental/exp1/context?strategy=RAG&repetition=1')
})
