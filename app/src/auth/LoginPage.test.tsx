import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { setAuthModeForTests } from './authMode'
import { LoginPage } from './LoginPage'
import { renderAuthPage } from './test/renderAuthPage'

function Home() {
  return <div>Inicio</div>
}

beforeEach(() => {
  localStorage.clear()
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

describe('LoginPage', () => {
  it('permite iniciar sesión navegando solo con teclado (Tab + Enter) y navega a la ruta por defecto', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    await user.tab()
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    await user.keyboard('demo@rag-test-studio.local')
    await user.tab()
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    await user.keyboard('secret1')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('muestra un mensaje genérico ante credenciales inválidas, sin revelar si la cuenta existe', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />)
    await user.type(screen.getByLabelText('Correo'), 'demo@rag-test-studio.local')
    await user.type(screen.getByLabelText('Contraseña'), '123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos verificar tus credenciales. Revisa el correo y la contraseña.')
  })

  it('HU38: navega a "returnTo" por query string aunque no haya state.from (deep-link tras recarga)', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, {
      initialEntry: '/login?returnTo=%2Faction-required%2Farun_checkout_pr42',
      routePath: '/login',
      extraRoutes: <Route path="/action-required/:analysisRunId" element={<div>Focus Mode arun_checkout_pr42</div>} />,
    })
    await user.type(screen.getByLabelText('Correo'), 'demo@rag-test-studio.local')
    await user.type(screen.getByLabelText('Contraseña'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Focus Mode arun_checkout_pr42')).toBeInTheDocument()
  })

  it('HU38: ignora un "returnTo" externo (open-redirect) y navega a la ruta por defecto', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, {
      initialEntry: '/login?returnTo=' + encodeURIComponent('//evil.example/phish'),
      routePath: '/login',
      extraRoutes: <Route path="/" element={<Home />} />,
    })
    await user.type(screen.getByLabelText('Correo'), 'demo@rag-test-studio.local')
    await user.type(screen.getByLabelText('Contraseña'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('HU29 ampliado: "Continuar con GitHub" inicia sesión y respeta el mismo returnTo', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, {
      initialEntry: '/login?returnTo=%2Fanalysis-runs',
      routePath: '/login',
      extraRoutes: <Route path="/analysis-runs" element={<div>Runs</div>} />,
    })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByText('Runs')).toBeInTheDocument()
  })
})
