import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { ArtifactWorkspace } from './ArtifactWorkspace'
import type { ArtifactViewModel } from './types'

const artifacts: ArtifactViewModel[] = [
  { id: 'a1', runId: 'r1', relativePath: 'src/cart.test.ts', artifactType: 'CREATED', valid: true, lines: [{ type: 'ADDED', newLineNumber: 1, content: "import { Cart } from './cart'" }] },
  { id: 'a2', runId: 'r1', relativePath: 'src/user.test.ts', artifactType: 'MODIFIED', valid: false, lines: [{ type: 'REMOVED', oldLineNumber: 8, content: 'expect(save()).toBe(true)' }, { type: 'ADDED', newLineNumber: 8, content: 'expect(await save()).toBe(true)' }] },
]

test('CREATED se presenta como archivo nuevo', () => {
  render(<ArtifactWorkspace artifacts={artifacts} />)
  expect(screen.getByText('Archivo nuevo · todo el contenido fue agregado')).toBeInTheDocument()
})

test('permite seleccionar un MODIFIED y muestra su diff', async () => {
  const user = userEvent.setup()
  render(<ArtifactWorkspace artifacts={artifacts} />)
  await user.click(screen.getByRole('button', { name: /user.test.ts/ }))
  expect(screen.getByText('Comparación con archivo original')).toBeInTheDocument()
  expect(screen.getByText('expect(await save()).toBe(true)')).toBeInTheDocument()
})

test('mantiene descargas deshabilitadas sin contrato', () => {
  render(<ArtifactWorkspace artifacts={artifacts} />)
  expect(screen.getByRole('button', { name: 'Descargar lote' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeDisabled()
})
