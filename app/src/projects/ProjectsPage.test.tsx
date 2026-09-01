import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { setDataSourceForTests } from '../api/dataSource'
import { ProjectsPage } from './ProjectsPage'

test('no consulta un listado cuyo contrato está pendiente', () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<ProjectsPage />)
  expect(screen.getByText('Listado todavía no disponible')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('presenta el escenario semilla en modo demo sin consultar la red', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<ProjectsPage />)
  expect(await screen.findByText('checkout-service')).toBeInTheDocument()
  expect(screen.getByText('Demo preparada')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('crea un proyecto con el contrato implementado', async () => {
  const created = { id: 'p-1', name: 'checkout', currentVersionId: null, createdAt: '2026-08-30', updatedAt: '2026-08-30' }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(created), { status: 201 }))
  const user = userEvent.setup()
  renderApp(<ProjectsPage />)
  await user.type(screen.getByLabelText('Nombre del proyecto'), ' checkout ')
  await user.click(screen.getByRole('button', { name: 'Crear proyecto' }))
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'checkout' }) }))
})
