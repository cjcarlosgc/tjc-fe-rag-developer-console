import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { RunProgress } from './RunProgress'
import { ValidationResults } from './ValidationResults'
import { isTerminalRunStatus, type RunViewModel } from './types'

const run: RunViewModel = { id: 'r-1', status: 'PARTIAL', processed: 2, total: 2, targets: [
  { id: '1', label: 'Cart.total', filePath: 'src/cart.ts', status: 'VALID', compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE' },
  { id: '2', label: 'User.save', filePath: 'src/user.ts', status: 'INVALID', compiled: false, executed: false, passed: false, valid: false, failureType: 'COMPILATION', errorSummary: 'TS2345', errorDetail: 'Argument incompatible' },
] }

test('PARTIAL es terminal y permanece visible', () => {
  expect(isTerminalRunStatus('PARTIAL')).toBe(true)
  render(<RunProgress run={run} />)
  expect(screen.getByText('Resultado parcial')).toBeInTheDocument()
})

test('distingue prueba inválida de fallo de plataforma', () => {
  render(<ValidationResults run={run} />)
  expect(screen.getByText('Inválidas').previousSibling).toHaveTextContent('1')
  expect(screen.getByText('Fallo plataforma').previousSibling).toHaveTextContent('0')
})

test('expande el detalle del error sin saturar la tabla', async () => {
  const user = userEvent.setup()
  render(<ValidationResults run={run} />)
  await user.click(screen.getByText('Ver error'))
  expect(screen.getByText('Argument incompatible')).toBeVisible()
})

test('HU24: solo ofrece reintentar el target inválido de un run terminal', () => {
  const onRetry = () => {}
  render(<ValidationResults run={run} onRetry={onRetry} />)
  const retryButtons = screen.getAllByRole('button', { name: 'Reintentar' })
  expect(retryButtons).toHaveLength(1)
})

test('HU24: sin onRetry no aparece la columna de retry', () => {
  render(<ValidationResults run={run} />)
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  expect(screen.queryByText('Retry')).not.toBeInTheDocument()
})

test('HU24: un run no terminal no ofrece reintento aunque haya un target inválido', () => {
  const inProgress = { ...run, status: 'GENERATING' as const }
  render(<ValidationResults run={inProgress} onRetry={() => {}} />)
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
})
