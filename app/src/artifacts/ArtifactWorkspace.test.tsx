import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { ArtifactWorkspace } from './ArtifactWorkspace'
import type { ArtifactViewModel } from './types'

const artifacts: ArtifactViewModel[] = [
  { id: 'a1', runId: 'r1', relativePath: 'src/cart.test.ts', artifactType: 'CREATED', valid: true, lines: [{ type: 'ADDED', newLineNumber: 1, content: "import { Cart } from './cart'" }] },
  { id: 'a2', runId: 'r1', relativePath: 'src/user.test.ts', artifactType: 'MODIFIED', valid: false, lines: [{ type: 'REMOVED', oldLineNumber: 8, content: 'expect(save()).toBe(true)' }, { type: 'ADDED', newLineNumber: 8, content: 'expect(await save()).toBe(true)' }] },
]

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('CREATED se presenta como archivo nuevo', () => {
  renderWithRouter(<ArtifactWorkspace artifacts={artifacts} projectId="prj1" />)
  expect(screen.getByText('Archivo nuevo · todo el contenido fue agregado')).toBeInTheDocument()
})

test('permite seleccionar un MODIFIED y muestra su diff', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ArtifactWorkspace artifacts={artifacts} projectId="prj1" />)
  await user.click(screen.getByRole('button', { name: /user.test.ts/ }))
  expect(screen.getByText('Comparación con archivo original')).toBeInTheDocument()
  expect(screen.getByText('expect(await save()).toBe(true)')).toBeInTheDocument()
})

test('mantiene descargas deshabilitadas sin contrato', () => {
  renderWithRouter(<ArtifactWorkspace artifacts={artifacts} projectId="prj1" />)
  expect(screen.getByRole('button', { name: 'Descargar lote' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeDisabled()
})

test('el link "Ver contexto" apunta al explorador filtrado por artifactId', async () => {
  const user = userEvent.setup()
  renderWithRouter(<ArtifactWorkspace artifacts={artifacts} projectId="prj1" />)
  await user.click(screen.getByRole('button', { name: /user.test.ts/ }))
  expect(screen.getByRole('link', { name: 'Ver contexto' })).toHaveAttribute('href', '/projects/prj1/runs/r1/context?artifactId=a2')
})
