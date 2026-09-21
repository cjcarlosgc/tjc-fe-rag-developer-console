import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockAuthAdapter } from './adapters/mockAuthAdapter'
import { setAuthModeForTests } from './authMode'
import { LoginPage } from './LoginPage'
import { renderAuthPage } from './test/renderAuthPage'

function Home() {
  return <div>Inicio</div>
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  setAuthModeForTests('mock')
  setDataSourceForTests('mock')
})

afterEach(() => vi.restoreAllMocks())

describe('LoginPage', () => {
  it('HU62: ofrece un único CTA «Continuar con GitHub», sin campos de correo/contraseña ni links de recuperación o solicitud de acceso', () => {
    renderAuthPage(<LoginPage />)
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByLabelText('Correo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('permite iniciar sesión solo con teclado (Tab + Enter) y navega a la ruta por defecto', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    await user.tab()
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('muestra «Conectando…» con el botón deshabilitado mientras inicia sesión', async () => {
    const user = userEvent.setup()
    let finish: (value: null) => void = () => {}
    vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockReturnValue(new Promise((resolve) => { finish = resolve }))
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(screen.getByRole('button', { name: 'Conectando…' })).toBeDisabled()
    // Sin sesión inmediata (redirección a GitHub en curso) el botón sigue deshabilitado y no navega.
    finish(null)
    await Promise.resolve()
    expect(screen.getByRole('button', { name: 'Conectando…' })).toBeDisabled()
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
  })

  it('un fallo al iniciar sesión muestra el error en un alert con «Reintentar» y rehabilita el botón', async () => {
    const user = userEvent.setup()
    const signIn = vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockRejectedValueOnce(new Error('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.'))
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos completar el acceso con GitHub')
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeEnabled()
    signIn.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('HU38: navega a "returnTo" por query string aunque no haya state.from (deep-link tras recarga)', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, {
      initialEntry: '/login?returnTo=%2Faction-required%2Farun_checkout_pr42',
      routePath: '/login',
      extraRoutes: <Route path="/action-required/:analysisRunId" element={<div>Focus Mode arun_checkout_pr42</div>} />,
    })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByText('Focus Mode arun_checkout_pr42')).toBeInTheDocument()
  })

  it('HU38: ignora un "returnTo" externo (open-redirect) y navega a la ruta por defecto', async () => {
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, {
      initialEntry: '/login?returnTo=' + encodeURIComponent('//evil.example/phish'),
      routePath: '/login',
      extraRoutes: <Route path="/" element={<Home />} />,
    })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('HU62: muestra en /login el error del callback OAuth (parámetros de la URL de retorno)', async () => {
    window.history.replaceState(null, '', '/login#error=access_denied&error_code=oauth_denied')
    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('HU62: en modo mock muestra el rótulo «DEMO · IDENTIDAD SIMULADA»', () => {
    renderAuthPage(<LoginPage />)
    expect(screen.getByText('DEMO · IDENTIDAD SIMULADA')).toBeInTheDocument()
  })

  it('HU62: tras un pageshow persistido (Atrás desde GitHub, bfcache) el botón deja de estar en «Conectando…»', async () => {
    const user = userEvent.setup()
    vi.spyOn(mockAuthAdapter, 'signInWithGitHub').mockResolvedValue(null)
    renderAuthPage(<LoginPage />, { initialEntry: '/login', routePath: '/login', extraRoutes: <Route path="/" element={<Home />} /> })
    await user.click(screen.getByRole('button', { name: 'Continuar con GitHub' }))
    expect(await screen.findByRole('button', { name: 'Conectando…' })).toBeDisabled()

    // Un pageshow sin restaurar desde bfcache no cambia nada.
    act(() => { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false })) })
    expect(screen.getByRole('button', { name: 'Conectando…' })).toBeDisabled()

    act(() => { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })) })
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeEnabled()
  })
})
