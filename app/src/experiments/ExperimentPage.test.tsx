import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { ExperimentPage } from './ExperimentPage'

test('ejecuta y presenta una comparación simulada sin red', async () => {
  setDataSourceForTests('mock')
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' })

  expect(await screen.findByRole('heading', { name: 'RAG vs Agente generalista', level: 1 })).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))

  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText('Laboratorio simulado')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
