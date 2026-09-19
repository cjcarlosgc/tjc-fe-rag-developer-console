import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { FunctionalKnowledgePage } from './FunctionalKnowledgePage'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderPage(projectId: string) {
  return renderApp(<FunctionalKnowledgePage />, { initialEntry: `/projects/${projectId}/functional-knowledge`, routePath: '/projects/:projectId/functional-knowledge' })
}

test('HU35/HU36: lista las reglas del proyecto con badge ACTIVE/SUPERSEDED', async () => {
  renderPage('prj_checkout_demo')

  expect(await screen.findByText('Un cupón vencido nunca debe aplicarse, incluso si el pedido ya está marcado como pagado.')).toBeInTheDocument()
  expect(screen.getAllByText('ACTIVE')).toHaveLength(3)
  expect(screen.getByText('SUPERSEDED')).toBeInTheDocument()
})

test('HU35/HU36: filtra por estado', async () => {
  const user = userEvent.setup()
  renderPage('prj_checkout_demo')

  await screen.findByText('SUPERSEDED')
  await user.click(screen.getByRole('button', { name: 'Active' }))

  expect(screen.queryByText('SUPERSEDED')).not.toBeInTheDocument()
  expect(screen.getAllByText('ACTIVE')).toHaveLength(3)
})
