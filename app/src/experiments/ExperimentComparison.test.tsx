import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { formatDuration } from '../formatting'
import { ExperimentComparison } from './ExperimentComparison'
import type { ExperimentConfiguration, ExperimentResultViewModel } from './types'

const configuration: ExperimentConfiguration = {
  model: { provider: 'OpenAI', model: 'gpt-6-luna', modelVersion: null, reasoningEffort: 'high', temperature: null, maxOutputTokens: null },
  budget: { toolCallCap: 8, contextTokenBudget: 12000, maxDurationMs: 60000 },
  executionProfile: 'sandbox-test-profile',
  runnerHint: 'hint-no-mostrar',
  randomizationSeed: 'seed-test-42',
}

const withValues: ExperimentResultViewModel = {
  baseline: { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .5, executionRate: .5, passedRate: .5, totalDurationMs: 1000, totalTokens: 100, estimatedCost: .01, failures: { INFRASTRUCTURE: 1 } },
  rag: { strategy: 'RAG', validRate: .75, compilationRate: .75, executionRate: .75, passedRate: .75, totalDurationMs: 1500, totalTokens: 160, estimatedCost: .02, failures: {} },
  configuration,
  repetitions: [
    { target: 'Cart.total', repetition: 1, strategy: 'GENERALIST_AGENT', valid: true, failureType: 'NONE', durationMs: 500, totalTokens: 50, errorSummary: null, pairId: 'pair-visible-1', pairPosition: 2, attempt: 1, technicallyEvaluable: true },
    { target: 'Cart.total', repetition: 3, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'INFRASTRUCTURE', durationMs: 800, totalTokens: 60, errorSummary: 'fallo externo', pairId: 'pair-visible-3', pairPosition: 1, attempt: 2, technicallyEvaluable: false },
  ],
}

const withNulls: ExperimentResultViewModel = {
  ...withValues,
  configuration: null,
  repetitions: [{ target: 'Cart.total', repetition: 2, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 500, totalTokens: null, errorSummary: null, pairId: null, pairPosition: null, attempt: null, technicallyEvaluable: null }],
}

function openDetail(container: HTMLElement) {
  return container.querySelector('details') as HTMLDetailsElement
}

function rowCells(text: string): HTMLElement[] {
  const row = screen.getByText(text).closest('tr') as HTMLElement
  return within(row).getAllByRole('cell')
}

const result: ExperimentResultViewModel = { baseline: { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .6, executionRate: .5, passedRate: .5, totalDurationMs: 1000, totalTokens: 100, estimatedCost: .01, failures: { COMPILATION: 2 } }, rag: { strategy: 'RAG', validRate: .75, compilationRate: .8, executionRate: .75, passedRate: .75, totalDurationMs: 1500, totalTokens: 160, estimatedCost: .02, failures: { COMPILATION: 1 }, retrievedChunks: 20, selectedChunks: 6, contextTokens: 1200 }, repetitions: [{ target: 'Cart.total', repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 500, totalTokens: 50, errorSummary: null, pairId: null, pairPosition: null, attempt: null, technicallyEvaluable: null }] }

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
  const failed: ExperimentResultViewModel = { ...result, repetitions: [{ target: 'Cart.total', repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'COMPILATION', durationMs: 500, totalTokens: 50, errorSummary: 'jest.config.js: Cannot find module ts-jest', pairId: null, pairPosition: null, attempt: null, technicallyEvaluable: null }] }
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

test('las tasas usan una clase neutra y ninguna clase de éxito o peligro', () => {
  const { container } = renderWithRouter(<ExperimentComparison result={result} projectId="prj1" experimentId="exp1" />)
  expect(screen.getAllByText('+25.0 pp')[0]).toHaveClass('rate-delta')
  const deltaNodes = Array.from(container.querySelectorAll('[class*="delta"]'))
  expect(deltaNodes.length).toBeGreaterThan(0)
  for (const node of deltaNodes) expect(node.getAttribute('class')).toBe('rate-delta')
})

test('la tabla de repeticiones tiene columnas de par, posición, intento y evaluabilidad con scope col', async () => {
  const user = userEvent.setup()
  const { container } = renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  for (const name of ['Par', 'Posición', 'Intento', 'Evaluable']) {
    expect(screen.getByRole('columnheader', { name })).toHaveAttribute('scope', 'col')
  }
  expect(openDetail(container)).toHaveAttribute('open')
})

test('muestra pairId tal cual, posición, intento y evaluabilidad con valores reales', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  const cells = rowCells('pair-visible-1')
  expect(cells[4]).toHaveTextContent('pair-visible-1')
  expect(cells[5]).toHaveTextContent('2.º en el par')
  expect(cells[6]).toHaveTextContent('1.º')
  expect(cells[7]).toHaveTextContent('Sí')
  expect(cells[7]).not.toHaveTextContent('técnicamente no evaluable')
})

test('marca visible «técnicamente no evaluable» en texto y sin recalcular la fila', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  const mark = screen.getByText('técnicamente no evaluable')
  expect(mark).toBeVisible()
  const cells = rowCells('pair-visible-3')
  expect(cells[7]).toHaveTextContent('No')
  expect(cells[6]).toHaveTextContent('2.º')
  expect(cells[7]).toContainElement(mark)
})

test('null en par, posición, intento y evaluable se muestra como «no disponible», nunca como 0', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={withNulls} projectId="prj1" experimentId="exp1" />)
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  const cells = rowCells('Cart.total')
  expect(cells[4].textContent).toBe('no disponible')
  expect(cells[5].textContent).toBe('no disponible')
  expect(cells[6].textContent).toBe('no disponible')
  expect(cells[7].textContent).toBe('no disponible')
  for (const cell of cells.slice(4, 8)) expect(cell.textContent).not.toMatch(/\b0\b/)
  expect(screen.queryByText('técnicamente no evaluable')).toBeNull()
})

test('el bloque Configuración muestra modelo, presupuesto, perfil y semilla, sin runnerHint', () => {
  const { container } = renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  const section = screen.getByRole('region', { name: 'Configuración' })
  expect(within(section).getByRole('heading', { level: 3, name: 'Configuración' })).toBeInTheDocument()
  expect(within(section).getByText('OpenAI · gpt-6-luna')).toBeInTheDocument()
  expect(within(section).getByText('high')).toBeInTheDocument()
  expect(within(section).getByText(`${(12000).toLocaleString('es-PE')} tokens`)).toBeInTheDocument()
  expect(within(section).getByText(formatDuration(60000))).toBeInTheDocument()
  expect(within(section).getByText('sandbox-test-profile')).toBeInTheDocument()
  expect(within(section).getByText('seed-test-42')).toBeInTheDocument()
  expect(within(section).getAllByText('no disponible').length).toBeGreaterThan(0)
  expect(container.textContent).not.toContain('hint-no-mostrar')
  expect(container.textContent).not.toMatch(/paridad/i)
  expect(within(section).getByText(/comunes a ambos brazos/)).toBeInTheDocument()
})

afterEach(() => setDataSourceForTests(null))

test('con datos mock el bloque Configuración muestra el rótulo DEMO · DATOS SIMULADOS', () => {
  setDataSourceForTests('mock')
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  const section = screen.getByRole('region', { name: 'Configuración' })
  expect(within(section).getByText('DEMO · DATOS SIMULADOS')).toBeVisible()
})

test('con datos live el bloque Configuración no muestra el rótulo DEMO', () => {
  setDataSourceForTests('live')
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  const section = screen.getByRole('region', { name: 'Configuración' })
  expect(within(section).queryByText('DEMO · DATOS SIMULADOS')).not.toBeInTheDocument()
})

test('con configuración ausente el bloque aparece con «no disponible»', () => {
  renderWithRouter(<ExperimentComparison result={withNulls} projectId="prj1" experimentId="exp1" />)
  const section = screen.getByRole('region', { name: 'Configuración' })
  expect(within(section).getByText('Semilla de aleatorización').nextElementSibling).toHaveTextContent('no disponible')
  expect(within(section).getAllByText('no disponible')).toHaveLength(9)
})

test('la región de detalle tiene nombre y el contenedor de scroll recibe foco por teclado', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  const region = screen.getByRole('region', { name: 'Detalle por target y repetición' })
  expect(region).toHaveAttribute('tabindex', '0')
  await user.click(screen.getByText('Ver detalle por target y repetición'))
  await user.tab()
  expect(region).toHaveFocus()
})

test('los títulos de sección son encabezados de nivel 3', () => {
  renderWithRouter(<ExperimentComparison result={withValues} projectId="prj1" experimentId="exp1" />)
  expect(screen.getByRole('heading', { level: 3, name: 'Distribución de fallos' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'Huella de retrieval' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'Configuración' })).toBeInTheDocument()
})
