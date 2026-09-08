import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { startGeneration } from '../generation/api'
import { getTestInventory, toInventoryTargets } from '../inventory/api'
import { renderApp } from '../test/render'
import { getRun } from './api'
import { isTerminalRunStatus } from './types'
import { RunHistoryPage } from './RunHistoryPage'

test('lista el historial de generaciones de la versión actual del proyecto', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  renderApp(<RunHistoryPage />, { initialEntry: '/projects/prj_checkout_demo/runs', routePath: '/projects/:projectId/runs' })

  expect(await screen.findByText('run_checkout_seed')).toBeInTheDocument()
  expect(screen.getByText('Faltantes del proyecto')).toBeInTheDocument()
  expect(screen.getByText('1 válidos · 1 inválidos / 2')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'run_checkout_seed' }).getAttribute('href')).toBe('/projects/prj_checkout_demo/runs/run_checkout_seed')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('HU20: filtra el historial por estado', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const user = userEvent.setup()

  const inventory = await getTestInventory('ver_checkout_7')
  const target = toInventoryTargets(inventory).find((item) => item.kind === 'METHOD' && item.hasExistingTest)!
  const accepted = await startGeneration({ projectId: 'prj_checkout_demo', mode: 'TARGET', target }, crypto.randomUUID())
  let run = await getRun(accepted.runId)
  for (let index = 0; index < 4 && !isTerminalRunStatus(run.status); index += 1) run = await getRun(accepted.runId)
  expect(run.status).toBe('COMPLETED')

  renderApp(<RunHistoryPage />, { initialEntry: '/projects/prj_checkout_demo/runs', routePath: '/projects/:projectId/runs' })

  expect(await screen.findByText('run_checkout_seed')).toBeInTheDocument()
  expect(screen.getByText(accepted.runId)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Completados' }))
  expect(screen.getByText(accepted.runId)).toBeInTheDocument()
  expect(screen.queryByText('run_checkout_seed')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Parciales' }))
  expect(screen.getByText('run_checkout_seed')).toBeInTheDocument()
  expect(screen.queryByText(accepted.runId)).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Todos' }))
  expect(screen.getByText('run_checkout_seed')).toBeInTheDocument()
  expect(screen.getByText(accepted.runId)).toBeInTheDocument()
})

test('acepta un projectVersionId explícito por ruta', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  renderApp(<RunHistoryPage />, {
    initialEntry: '/projects/prj_checkout_demo/versions/ver_checkout_6/runs',
    routePath: '/projects/:projectId/versions/:projectVersionId/runs',
  })

  expect(await screen.findByText('Sin generaciones registradas')).toBeInTheDocument()
})
