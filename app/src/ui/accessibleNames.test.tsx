import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { AuthProvider } from '../auth/AuthProvider'
import { setAuthModeForTests } from '../auth/authMode'
import { FocusModePage } from '../action-required/FocusModePage'
import { ConfigurationErrorScreen } from '../config/ConfigurationErrorScreen'
import { ProjectsPage } from '../projects/ProjectsPage'
import { renderApp } from '../test/render'
import { AppShell } from './AppShell'

// WI-CONSOLE-047, corte D (observación 6): roles y nombres accesibles reales (getByRole + name) en las pantallas
// que no tenían esa cobertura: Focus Mode, Projects (tarjetas, KPI con su rótulo de ámbito), badge del nav,
// orden de tabulación del shell y pantalla de error de configuración. jsdom no calcula layout: la evidencia de
// tamaños y reflow está en el navegador (harness/reports/wi-console-047-a11y-verification.md).

const FOCUS_QUESTION = '¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?'

beforeEach(() => {
  localStorage.clear()
  setDataSourceForTests('mock')
  setAuthModeForTests('mock')
  resetMockBackend()
})

describe('Focus Mode: roles y nombres', () => {
  function renderFocus() {
    return renderApp(<FocusModePage />, {
      initialEntry: '/action-required/arun_checkout_pr42',
      routePath: '/action-required/:analysisRunId',
    })
  }

  it('la pregunta es el encabezado de nivel 2 y el contexto de página es el h1 del PageHeader', async () => {
    renderFocus()
    expect(await screen.findByRole('heading', { level: 2, name: FOCUS_QUESTION })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Contexto funcional' })).toBeInTheDocument()
  })

  it('el destino de la regla es un grupo con nombre (aria-labelledby) y su encabezado de nivel 3', async () => {
    renderFocus()
    await screen.findByRole('heading', { level: 2, name: FOCUS_QUESTION })
    expect(screen.getByRole('group', { name: 'Destino de la regla' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Destino de la regla' })).toBeInTheDocument()
  })

  it('las respuestas son botones con nombre dentro del grupo «Respuesta»; el texto libre tiene su etiqueta', async () => {
    renderFocus()
    await screen.findByRole('heading', { level: 2, name: FOCUS_QUESTION })
    const answers = screen.getByRole('group', { name: 'Respuesta' })
    expect(within(answers).getByRole('button', { name: 'Sí' })).toBeEnabled()
    expect(within(answers).getByRole('button', { name: 'No lo sé' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'Aclaración (opcional)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Responder solo con este texto' })).toBeDisabled()
  })

  it('«Volver» es un enlace con nombre que apunta al listado por defecto', async () => {
    renderFocus()
    await screen.findByRole('heading', { level: 2, name: FOCUS_QUESTION })
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/action-required')
  })
})

describe('Projects: tarjetas, KPI con rótulo de ámbito', () => {
  it('cada tarjeta de Project es un enlace cuyo nombre accesible incluye el nombre del Project', async () => {
    renderApp(<ProjectsPage />)
    // Hay más enlaces con «checkout-service» (Runs, Action Required): la tarjeta se localiza por su encabezado de nivel 2.
    // Mientras carga el binding la tarjeta es un <div> (estado pendiente): se espera a que sea el enlace definitivo.
    const card = await waitFor(() => {
      const link = screen.getByRole('heading', { level: 2, name: 'checkout-service' }).closest('a')
      if (!(link instanceof HTMLAnchorElement)) throw new Error('la tarjeta aún no es un enlace')
      return link
    })
    expect(card).toHaveClass('project-card')
    expect(card).toHaveAccessibleName(/checkout-service/)
    expect(card.getAttribute('href')).toMatch(/^\/projects\/prj_checkout_demo/)
  })

  it('el KPI «Action Required» tiene su rótulo de ámbito «Workspace seleccionado» y su valor coincide con las tarjetas', async () => {
    renderApp(<ProjectsPage />)
    const label = screen.getByText('Action Required', { selector: '.kpi-card > span' })
    const card = label.closest('.kpi-card')
    if (!(card instanceof HTMLElement)) throw new Error('KPI Action Required sin contenedor .kpi-card')
    expect(card).toHaveTextContent('Workspace seleccionado')
    await waitFor(() => expect(card.querySelector('strong')).toHaveTextContent(/^3$/))
  })
})

describe('AppShell: badge del nav y orden de tabulación', () => {
  function renderShell() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<div>Inicio</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    )
  }

  it('el enlace «Action Required» del nav incluye el recuento y su ámbito global en el nombre accesible', async () => {
    renderShell()
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    const nav = within(navigation).getByRole('link', { name: /Action Required/ })
    // El separador va dentro del texto oculto (no como espacio entre nodos): así el nombre no depende de cómo cada motor trata el espacio inicial.
    await waitFor(() => expect(nav).toHaveAccessibleName('Action Required, 5 pendientes en todos tus Workspaces'))
  })

  it('Tab recorre el shell en orden: saltar al contenido, marca, Runs, Action Required', async () => {
    renderShell()
    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'RAG Test Studio, Projects' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Runs' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /Action Required/ })).toHaveFocus()
  })
})

describe('Pantalla de error de configuración: árbol accesible', () => {
  it('tiene un único h1 con nombre, una alerta y ningún enlace ni navegación (no hay router montado)', () => {
    render(<ConfigurationErrorScreen issue={{ variable: 'VITE_CORE_API_URL', reason: 'invalid-url' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Configuración no válida' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('VITE_CORE_API_URL no es una URL válida')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
