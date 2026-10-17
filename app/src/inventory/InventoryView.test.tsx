import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { InventoryView } from './InventoryView'

const targets = [
  { id: '1', filePath: 'src/cart.ts', symbolName: 'Cart', methodName: 'total', kind: 'METHOD' as const, hasExistingTest: false, testFilePaths: [] },
  { id: '2', filePath: 'src/user.ts', symbolName: 'User', kind: 'CLASS' as const, hasExistingTest: true, testFilePaths: ['src/user.spec.ts'] },
]

test('filtra targets sin cobertura', async () => {
  const user = userEvent.setup()
  render(<InventoryView targets={targets} />)
  await user.click(screen.getByRole('button', { name: 'Sin test' }))
  expect(screen.getByText('total')).toBeInTheDocument()
  expect(screen.queryByText('User')).not.toBeInTheDocument()
})

test('el inventario es de consulta y no permite seleccionar un target para generar', () => {
  render(<InventoryView targets={targets} />)
  expect(screen.getByText('total')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /usar target/i })).not.toBeInTheDocument()
})
