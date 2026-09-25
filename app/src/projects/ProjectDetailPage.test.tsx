import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockCreateProject, resetMockBackend } from '../api/mockBackend'
import { disconnectRepository } from '../control-plane/api'
import { renderApp } from '../test/render'
import { deleteProject, getProject } from './api'
import { ProjectDetailPage } from './ProjectDetailPage'
import { ProjectsPage } from './ProjectsPage'

afterEach(() => setDataSourceForTests(null))

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

function renderDetail(projectId: string) {
  return renderApp(<ProjectDetailPage />, { initialEntry: `/projects/${projectId}`, routePath: '/projects/:projectId' })
}

test('HU30: un proyecto vinculado muestra el binding', async () => {
  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.getByText('develop')).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
})

test('la sub-nav del proyecto (ProjectTabs) enlaza a Runs/Functional Knowledge/Integrations, con Overview activo', async () => {
  renderDetail('prj_checkout_demo')

  const nav = await screen.findByRole('navigation', { name: 'Secciones del proyecto' })
  expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Runs' })).toHaveAttribute('href', '/analysis-runs?projectId=prj_checkout_demo&workspaceId=1000001')
  expect(within(nav).getByRole('link', { name: 'Functional Knowledge' })).toHaveAttribute('href', '/projects/prj_checkout_demo/functional-knowledge?workspaceId=1000001')
  expect(within(nav).getByRole('link', { name: 'Integrations' })).toHaveAttribute('href', '/projects/prj_checkout_demo/integrations/github?workspaceId=1000001')
})

test('"Modo experimental" es visible como capacidad propia, no legacy', async () => {
  renderDetail('prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.getByRole('link', { name: /Modo experimental/ })).toHaveAttribute('href', '/projects/prj_checkout_demo/experimental?workspaceId=1000001')
})

test('el proyecto no ofrece flujos manuales de carga, generación ni herramientas antiguas', async () => {
  renderDetail('prj_checkout_demo')

  await screen.findByText('checkout-service', { selector: '.repo-name' })
  expect(screen.queryByText('Cargar código fuente')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Configurar generación' })).not.toBeInTheDocument()
  expect(screen.queryByText(/ZIP|legacy|generación manual/i)).not.toBeInTheDocument()
})

test('HU30: un proyecto sin binding ofrece conectar GitHub', async () => {
  const project = await mockCreateProject({ name: 'sin-binding' })

  renderDetail(project.id)

  expect(await screen.findByText('Sin repositorio vinculado')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Conectar GitHub/ })).toHaveAttribute('href', `/projects/${project.id}/integrations/github?workspaceId=1000001`)
})

test('HU57: un proyecto desconectado muestra el binding como Pausado, no como "sin repositorio"', async () => {
  await disconnectRepository('prj_checkout_demo')

  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('Pausado')).toBeInTheDocument()
  expect(screen.getByText('checkout-service', { selector: '.repo-name' })).toBeInTheDocument()
  expect(screen.queryByText('Sin repositorio vinculado')).not.toBeInTheDocument()
})

test('HU56: un proyecto eliminado muestra "El proyecto ya no existe" con enlace a Proyectos y sin Reintentar', async () => {
  await deleteProject('prj_checkout_demo')

  renderDetail('prj_checkout_demo')

  expect(await screen.findByText('El proyecto ya no existe')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a Proyectos' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Eliminar proyecto' })).not.toBeInTheDocument()
})

test('HU56: Eliminar proyecto pide confirmación explícita, permite cancelar y está marcado como DEMO', async () => {
  const user = userEvent.setup()
  renderDetail('prj_checkout_demo')

  await user.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }))
  const confirmation = screen.getByRole('group', { name: 'Confirmar eliminación del proyecto' })
  expect(within(confirmation).getByText('checkout-service')).toBeInTheDocument()
  expect(confirmation).toHaveTextContent('El proyecto dejará de verse y se liberará el repositorio vinculado; la evidencia no se borra físicamente')
  expect(screen.getByText('DEMO · ELIMINAR SIMULADO')).toBeInTheDocument()

  await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('group', { name: 'Confirmar eliminación del proyecto' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Eliminar proyecto' })).toBeInTheDocument()
})

test('HU56: al abrir la confirmación el foco va a «Cancelar» (no al botón destructivo) y al cancelar vuelve a «Eliminar proyecto»', async () => {
  const user = userEvent.setup()
  renderDetail('prj_checkout_demo')

  await user.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }))
  const confirmation = screen.getByRole('group', { name: 'Confirmar eliminación del proyecto' })
  expect(within(confirmation).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  expect(within(confirmation).getByRole('button', { name: 'Eliminar checkout-service' })).not.toHaveFocus()

  await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByRole('button', { name: 'Eliminar proyecto' })).toHaveFocus()
})

test('HU56: confirmar la eliminación borra el proyecto, navega a la lista con el aviso y el foco en el h1, sin parpadeo de "no encontrado"', async () => {
  const user = userEvent.setup()
  renderApp(
    <Routes>
      <Route path="/" element={<ProjectsPage />} />
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>,
    { initialEntry: '/projects/prj_checkout_demo' },
  )
  await user.click(await screen.findByRole('button', { name: 'Eliminar proyecto' }))

  // Se vigila todo el DOM mientras dura el borrado: ni el ErrorState ni el "no existe" deben asomar en ningún momento.
  let sawNotFound = false
  const observer = new MutationObserver(() => {
    const text = document.body.textContent ?? ''
    if (text.includes('El proyecto ya no existe') || text.includes('No pudimos cargar esta información') || text.includes('No existe el proyecto demo')) sawNotFound = true
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  await user.click(screen.getByRole('button', { name: 'Eliminar checkout-service' }))

  expect(await screen.findByRole('heading', { name: 'Proyectos', level: 1 })).toHaveFocus()
  expect(await screen.findByText('Proyecto «checkout-service» eliminado')).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'billing-engine' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'checkout-service' })).not.toBeInTheDocument()
  await new Promise((resolve) => setTimeout(resolve, 50))
  observer.disconnect()
  expect(sawNotFound).toBe(false)
  await expect(getProject('prj_checkout_demo')).rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND' })
})
