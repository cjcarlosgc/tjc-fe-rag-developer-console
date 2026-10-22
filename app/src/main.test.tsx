import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `main.tsx` monta la aplicación en #root al evaluarse; cada caso lo reevalúa con su propia configuración.
describe('arranque de main.tsx con la configuración del entorno', () => {
  beforeEach(() => {
    vi.resetModules()
    document.title = ''
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.body.innerHTML = ''
  })

  it('en live con VITE_CORE_API_URL inválida muestra la pantalla de configuración en lugar de una página en blanco', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'live')
    vi.stubEnv('VITE_CORE_API_URL', 'ftp://user:secret@host')
    await import('./main')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('VITE_CORE_API_URL usa un protocolo no permitido')
    expect(document.title).toBe('Configuración no válida · RAG Test Studio')
    expect(document.body.textContent ?? '').not.toContain('secret')
  })

  it('en mock con VITE_CORE_API_URL inválida arranca la aplicación sin pantalla de configuración', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock')
    vi.stubEnv('VITE_CORE_API_URL', 'ftp://user:secret@host')
    await import('./main')
    await waitFor(() => expect(document.getElementById('root')!.childElementCount).toBeGreaterThan(0))
    expect(screen.queryByText('Configuración no válida')).not.toBeInTheDocument()
    expect(document.title).not.toBe('Configuración no válida · RAG Test Studio')
  })
})
