import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { createProject } from './api'
import { ProjectsPage } from './ProjectsPage'

test('lista proyectos live con el contrato Page<ProjectResponse>', async () => {
  const page = {
    items: [
      { id: 'p-1', name: 'live-project', currentVersionId: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' },
    ],
    nextCursor: null,
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))
  renderApp(<ProjectsPage />)

  expect(await screen.findByRole('heading', { name: 'live-project' })).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.anything())
})

test('ofrece "Cargar más" cuando el listado live trae nextCursor', async () => {
  const firstPage = { items: [{ id: 'p-1', name: 'first-project', currentVersionId: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }], nextCursor: 'p-1' }
  const secondPage = { items: [{ id: 'p-2', name: 'second-project', currentVersionId: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }], nextCursor: null }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    return new Response(JSON.stringify(url.includes('cursor=p-1') ? secondPage : firstPage), { status: 200 })
  })
  const user = userEvent.setup()
  renderApp(<ProjectsPage />)

  expect(await screen.findByRole('heading', { name: 'first-project' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cargar más' }))
  expect(await screen.findByRole('heading', { name: 'second-project' })).toBeInTheDocument()
})

test('presenta el escenario semilla en modo demo sin consultar la red', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<ProjectsPage />)
  expect(await screen.findByText('checkout-service')).toBeInTheDocument()
  expect(screen.getByText('Demo preparada')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('HU25: filtra proyectos por nombre cuando hay más de cuatro', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  await createProject({ name: 'alpha-service' })
  await createProject({ name: 'beta-service' })
  await createProject({ name: 'gamma-service' })
  const user = userEvent.setup()

  renderApp(<ProjectsPage />)
  expect(await screen.findByText('alpha-service')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()

  await user.type(screen.getByLabelText('Buscar proyecto'), 'checkout')
  expect(screen.getByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.queryByText('alpha-service')).not.toBeInTheDocument()
  expect(screen.queryByText('beta-service')).not.toBeInTheDocument()
})

test('no ofrece buscador con pocos proyectos', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  renderApp(<ProjectsPage />)
  expect(await screen.findByRole('heading', { name: 'checkout-service' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Buscar proyecto')).not.toBeInTheDocument()
})

test('crea un proyecto con el contrato implementado', async () => {
  const created = { id: 'p-1', name: 'checkout', currentVersionId: null, createdAt: '2026-08-30', updatedAt: '2026-08-30' }
  const emptyPage = { items: [], nextCursor: null }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (init?.method === 'POST') return new Response(JSON.stringify(created), { status: 201 })
    return new Response(JSON.stringify(emptyPage), { status: 200 })
  })
  const user = userEvent.setup()
  renderApp(<ProjectsPage />)
  await screen.findByText('Todavía no hay proyectos')
  await user.type(screen.getByLabelText('Nombre del proyecto'), ' checkout ')
  await user.click(screen.getByRole('button', { name: 'Crear proyecto' }))
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'checkout' }) }))
})
