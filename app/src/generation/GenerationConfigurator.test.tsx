import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { GenerationConfigurator } from './GenerationConfigurator'

test('deshabilita modos que requieren target cuando no existe selección', () => {
  render(<GenerationConfigurator projectId="p-1" onConfirm={vi.fn()} />)
  expect(screen.getByRole('radio', { name: /Target puntual/ })).toBeDisabled()
  expect(screen.getByRole('radio', { name: /Clase completa/ })).toBeDisabled()
  expect(screen.getByRole('radio', { name: /Faltantes del proyecto/ })).toBeChecked()
})

test('exige confirmación para alcance masivo', async () => {
  const onConfirm = vi.fn()
  const user = userEvent.setup()
  render(<GenerationConfigurator projectId="p-1" onConfirm={onConfirm} />)
  const submit = screen.getByRole('button', { name: 'Confirmar configuración' })
  expect(submit).toBeDisabled()
  await user.click(screen.getByRole('checkbox'))
  await user.click(submit)
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p-1', mode: 'PROJECT_MISSING' }))
})

test('habilita TARGET para un target método', async () => {
  const target = { id: 't-1', filePath: 'src/cart.ts', symbolName: 'Cart', methodName: 'total', kind: 'METHOD' as const, hasExistingTest: false, testFilePaths: [] }
  const user = userEvent.setup()
  render(<GenerationConfigurator projectId="p-1" target={target} onConfirm={vi.fn()} />)
  await user.click(screen.getByRole('radio', { name: /Target puntual/ }))
  expect(screen.getByRole('button', { name: 'Confirmar configuración' })).toBeEnabled()
})

test('habilita TARGET para una función top-level', async () => {
  const onConfirm = vi.fn()
  const target = { id: 't-2', filePath: 'src/math.ts', symbolName: 'sum', kind: 'FUNCTION' as const, hasExistingTest: false, testFilePaths: [] }
  const user = userEvent.setup()
  render(<GenerationConfigurator projectId="p-1" target={target} onConfirm={onConfirm} />)
  await user.click(screen.getByRole('radio', { name: /Target puntual/ }))
  await user.click(screen.getByRole('button', { name: 'Confirmar configuración' }))
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ mode: 'TARGET', target }))
})
