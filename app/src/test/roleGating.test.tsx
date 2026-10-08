import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AnalysisRunDetailPage } from '../control-plane/AnalysisRunDetailPage'
import { ExperimentPage } from '../experiments/ExperimentPage'
import { RunComparisonPage } from '../run-comparison/RunComparisonPage'
import type { ProjectRole } from '../projects/types'
import { renderApp } from './render'

/**
 * Stub de prueba: el seed de `prj_checkout_demo` es ADMIN con `currentVersionId` (inventario real).
 * Solo se sobreescribe el rol que devuelve `useProject`; el resto del proyecto y los mocks de datos no cambian.
 * El rechazo real de rol en el backend mock sigue en `requireProjectRole`.
 */
const roleState = vi.hoisted(() => ({ role: 'WRITER' as ProjectRole }))

vi.mock('../projects/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../projects/queries')>()
  return {
    ...actual,
    useProject: (...args: Parameters<typeof actual.useProject>) => {
      const query = actual.useProject(...args)
      return { ...query, data: query.data ? { ...query.data, role: roleState.role } : query.data }
    },
  }
})

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

const EXPERIMENT_ENTRY = { initialEntry: '/projects/prj_checkout_demo/experimental', routePath: '/projects/:projectId/experimental' }
const COMPARISON_ENTRY = { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr45/comparison', routePath: '/projects/:projectId/runs/:analysisRunId/comparison' }
const DETAIL_ENTRY = { initialEntry: '/projects/prj_checkout_demo/runs/arun_checkout_pr45', routePath: '/projects/:projectId/runs/:analysisRunId' }

test('Experiment: Writer puede ejecutar la comparación', async () => {
  roleState.role = 'WRITER'
  const user = userEvent.setup()
  renderApp(<ExperimentPage />, EXPERIMENT_ENTRY)

  await user.click(await screen.findByRole('button', { name: 'Ejecutar comparación' }))
  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
})

test('Experiment: Reader ve el mensaje de solo lectura y no puede ejecutar', async () => {
  roleState.role = 'READER'
  renderApp(<ExperimentPage />, EXPERIMENT_ENTRY)

  expect(await screen.findByText('Tu rol es de solo lectura; un Writer, Maintainer o Admin puede crear experimentos.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ejecutar comparación' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
})

test('RunComparison: Writer arranca la comparación (auto-inicio con símbolo único)', async () => {
  roleState.role = 'WRITER'
  renderApp(<RunComparisonPage />, COMPARISON_ENTRY)

  expect(await screen.findByText('Huella de retrieval', {}, { timeout: 2000 })).toBeInTheDocument()
})

test('RunComparison: Reader no arranca ni puede iniciar la comparación', async () => {
  roleState.role = 'READER'
  renderApp(<RunComparisonPage />, COMPARISON_ENTRY)

  expect(await screen.findByText('Tu rol es de solo lectura; un Writer, Maintainer o Admin puede crear comparaciones.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Iniciar comparación' })).not.toBeInTheDocument()
  expect(screen.queryByText('Huella de retrieval')).not.toBeInTheDocument()
})

test('AnalysisRunDetail: Writer puede publicar las propuestas', async () => {
  roleState.role = 'WRITER'
  renderApp(<AnalysisRunDetailPage />, DETAIL_ENTRY)

  expect(await screen.findByRole('button', { name: /Publicar 3 propuesta\(s\)/ })).toBeInTheDocument()
  expect(screen.queryByText(/Tu rol es de solo lectura/)).not.toBeInTheDocument()
})

test('AnalysisRunDetail: Reader ve el mensaje de solo lectura y no puede publicar', async () => {
  roleState.role = 'READER'
  renderApp(<AnalysisRunDetailPage />, DETAIL_ENTRY)

  expect(await screen.findByText('Tu rol es de solo lectura. Un Writer, Maintainer o Admin puede publicar estas propuestas.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
})
