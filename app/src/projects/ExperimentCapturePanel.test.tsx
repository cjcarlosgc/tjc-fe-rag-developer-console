import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { renderApp } from '../test/render'
import { armExperimentCapture } from './api'
import { ExperimentCapturePanel } from './ExperimentCapturePanel'
import { ProjectDetailPage } from './ProjectDetailPage'
import type { ProjectRole } from './types'

// INTEROP-2.25 (§6.17, HU18): sección «Captura de experimentación». Demo con el mock; live con `fetch` simulado.

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const coreError = (code: string, status: number) => json({ code, message: 'mensaje crudo de Core', correlationId: 'corr-core' }, status)
const WARNING =
  'Captura armada: el siguiente PR elegible se reservará para experimentación y su Check no se publicará en GitHub. Desarma la captura si no quieres que ocurra.'

const armedBody = (captureId: string) => ({
  captureId,
  projectId: 'prj_live',
  status: 'ARMED',
  armedBy: 'usr_1',
  armedAt: '2026-10-30T10:00:00.000Z',
  reservedAnalysisRunId: null,
  reservedAt: null,
  disarmedBy: null,
  disarmedAt: null,
})

function renderPanel(projectId: string, role: ProjectRole) {
  return renderApp(<ExperimentCapturePanel projectId={projectId} workspaceId="1000001" role={role} />)
}

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => {
  vi.restoreAllMocks()
  setDataSourceForTests(null)
})

test('sin captura armada: Maintainer ve el estado, «Armar captura» y el rótulo DEMO, sin aviso', async () => {
  renderPanel('prj_billing_demo', 'MAINTAINER')

  expect(await screen.findByText('Sin capturas armadas.')).toBeInTheDocument()
  expect(screen.getByText('Sin captura armada', { selector: '.status-badge' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Armar captura' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Desarmar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
})

test('armar: el aviso aparece con role=status, el badge dice «Armada» y el foco pasa a «Desarmar»', async () => {
  const user = userEvent.setup()
  renderPanel('prj_billing_demo', 'MAINTAINER')

  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))

  const warning = await screen.findByRole('status')
  expect(warning).toHaveTextContent(WARNING)
  expect(screen.getByText('Armada', { selector: '.status-badge' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
  const disarm = within(warning).getByRole('button', { name: 'Desarmar' })
  await waitFor(() => expect(disarm).toHaveFocus())
})

test('desarmar: el aviso desaparece y el foco pasa a «Armar captura»', async () => {
  const user = userEvent.setup()
  await armExperimentCapture('prj_billing_demo')
  renderPanel('prj_billing_demo', 'MAINTAINER')

  await user.click(await screen.findByRole('button', { name: 'Desarmar' }))

  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  const arm = screen.getByRole('button', { name: 'Armar captura' })
  await waitFor(() => expect(arm).toHaveFocus())
  expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
})

test('el aviso es visible también para Reader y Writer mientras la captura está armada, sin botón Desarmar', async () => {
  await armExperimentCapture('prj_billing_demo')
  renderPanel('prj_billing_demo', 'WRITER')

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(WARNING))
  expect(screen.queryByRole('button', { name: 'Desarmar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
  expect(screen.getByText('Solo Maintainer o superior pueden armar o desarmar capturas.')).toBeInTheDocument()
})

test('Reader ve el estado de una captura reservada con enlace al Run, sin botones', async () => {
  renderPanel('prj_checkout_demo', 'READER')

  expect(await screen.findByText('Sin captura armada', { selector: '.status-badge' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'ver el Run reservado' })).toHaveAttribute(
    'href',
    '/projects/prj_checkout_demo/runs/arun_checkout_pr47?workspaceId=1000001',
  )
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desarmar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('mientras carga muestra el estado de carga, sin aviso y con «Armar captura» deshabilitado', async () => {
  renderPanel('prj_billing_demo', 'MAINTAINER')

  expect(screen.getByText('Cargando captura de experimentación…')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Armar captura' })).toBeDisabled()
  expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText('Cargando captura de experimentación…')).not.toBeInTheDocument())
})

test('live: Core sin INTEROP-2.25 muestra «no disponible» y oculta los botones', async () => {
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => coreError('NOT_FOUND', 404))

  renderPanel('prj_live', 'MAINTAINER')

  expect(await screen.findByText('Captura de experimentación no disponible en esta versión de Core.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desarmar' })).not.toBeInTheDocument()
})

test('live: un 500 al listar muestra el error de la sección con «Reintentar» y deja «Armar captura» deshabilitado', async () => {
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => coreError('INTERNAL_ERROR', 500))

  renderPanel('prj_live', 'MAINTAINER')

  expect(await screen.findByText('No se pudo cargar la captura de experimentación.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Armar captura' })).toBeDisabled()
})

test('live: 409 al armar relee la lista y muestra la captura que Core tiene realmente armada', async () => {
  const user = userEvent.setup()
  setDataSourceForTests('live')
  let armedInCore = false
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const { pathname } = new URL(String(input))
    if (pathname !== '/projects/prj_live/experiment-captures') return coreError('NOT_FOUND', 404)
    if (init?.method === 'POST') {
      armedInCore = true // otra sesión armó antes
      return coreError('EXPERIMENT_CAPTURE_ALREADY_ARMED', 409)
    }
    return json({ items: armedInCore ? [armedBody('cap_other')] : [], nextCursor: null })
  })
  renderPanel('prj_live', 'MAINTAINER')

  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Ya hay una captura armada en este Project. Desármala antes de armar otra.')
  expect(await screen.findByRole('status')).toHaveTextContent(WARNING)
  expect(screen.queryByRole('button', { name: 'Armar captura' })).not.toBeInTheDocument()
})

test('live: 403 al armar muestra el mensaje de permiso de la captura', async () => {
  const user = userEvent.setup()
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (init?.method === 'POST') return json({ code: 'PROJECT_ROLE_INSUFFICIENT', message: 'x' }, 403)
    return json({ items: [], nextCursor: null })
  })
  renderPanel('prj_live', 'MAINTAINER')

  await user.click(await screen.findByRole('button', { name: 'Armar captura' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para armar o desarmar capturas en este Project.')
  expect(screen.getByRole('button', { name: 'Armar captura' })).toBeEnabled()
})

test('live: 404 al desarmar (ya no estaba armada) muestra el mensaje y relee la lista', async () => {
  const user = userEvent.setup()
  setDataSourceForTests('live')
  let armedInCore = true
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
    if (init?.method === 'DELETE') {
      armedInCore = false
      return coreError('EXPERIMENT_CAPTURE_NOT_ARMED', 404)
    }
    return json({ items: armedInCore ? [armedBody('cap_live_1')] : [], nextCursor: null })
  })
  renderPanel('prj_live', 'MAINTAINER')

  await user.click(await screen.findByRole('button', { name: 'Desarmar' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('No hay una captura armada para desarmar.')
  expect(await screen.findByRole('button', { name: 'Armar captura' })).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('live: una captura de experimentación no disponible no bloquea el resto del Project', async () => {
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const { pathname } = new URL(String(input))
    if (pathname === '/projects/prj_live')
      return json({
        id: 'prj_live',
        name: 'proyecto-vivo',
        currentVersionId: null,
        workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'dev' },
        role: 'MAINTAINER',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    if (pathname.endsWith('/integrations/github')) return coreError('REPOSITORY_BINDING_NOT_FOUND', 404)
    if (pathname.endsWith('/experiment-captures')) return coreError('NOT_FOUND', 404)
    return coreError('NOT_FOUND', 404)
  })

  renderApp(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>,
    { initialEntry: '/projects/prj_live' },
  )

  expect(await screen.findByRole('heading', { name: 'proyecto-vivo', level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Sin repositorio vinculado')).toBeInTheDocument()
  expect(await screen.findByText('Captura de experimentación no disponible en esta versión de Core.')).toBeInTheDocument()
})
