import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { ExperimentComparison } from './ExperimentComparison'
import type { ExperimentResultViewModel } from './types'

const result: ExperimentResultViewModel = { baseline: { strategy: 'BASELINE', validRate: .5, compilationRate: .6, executionRate: .5, passedRate: .5, totalDurationMs: 1000, totalTokens: 100, estimatedCost: .01, failures: { COMPILATION: 2 } }, rag: { strategy: 'RAG', validRate: .75, compilationRate: .8, executionRate: .75, passedRate: .75, totalDurationMs: 1500, totalTokens: 160, estimatedCost: .02, failures: { COMPILATION: 1 }, retrievedChunks: 20, selectedChunks: 6, contextTokens: 1200 }, repetitions: [{ target: 'Cart.total', repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 500, totalTokens: 50 }] }

test('calcula diferencia de tasas en puntos porcentuales', () => {
  render(<ExperimentComparison result={result} />)
  expect(screen.getByText('Agente generalista')).toBeInTheDocument()
  expect(screen.getByText('Explora sus propias referencias')).toBeInTheDocument()
  expect(screen.getAllByText('+25.0 pp').length).toBeGreaterThan(0)
})

test('presenta diferencias absolutas y relativas para tiempo, tokens y costo', () => {
  render(<ExperimentComparison result={result} />)
  expect(screen.getByText('Δ +500 ms · +50%')).toBeInTheDocument()
  expect(screen.getByText('Δ +60 · +60%')).toBeInTheDocument()
  expect(screen.getByText('Δ +0.0100 USD · +100%')).toBeInTheDocument()
})

test('presenta retrieval únicamente como explicación RAG', () => {
  render(<ExperimentComparison result={result} />)
  expect(screen.getByText('Huella de retrieval')).toBeInTheDocument()
  expect(screen.getByText('20 chunks')).toBeInTheDocument()
})

test('permite abrir la trazabilidad por repetición', async () => {
  const user = userEvent.setup()
  render(<ExperimentComparison result={result} />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  expect(screen.getByText('Cart.total')).toBeVisible()
})
