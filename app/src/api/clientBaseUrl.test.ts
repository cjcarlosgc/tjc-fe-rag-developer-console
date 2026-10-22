import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Cada caso reevalúa `client.ts` con su propia configuración: `baseUrl` se fija al evaluar el módulo.
describe('baseUrl de client.ts según la fuente de datos', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('en mock, una URL inválida no lanza y usa mismo origen', async () => {
    vi.stubEnv('VITE_CORE_API_URL', 'ftp://user:secret@host')
    const dataSource = await import('./dataSource')
    dataSource.setDataSourceForTests('mock')
    const client = await import('./client')
    expect(client.baseUrl).toBe('')
  })

  it('en mock, una URL válida conserva su valor sin barra final', async () => {
    vi.stubEnv('VITE_CORE_API_URL', 'https://core.example.test/')
    const dataSource = await import('./dataSource')
    dataSource.setDataSourceForTests('mock')
    const client = await import('./client')
    expect(client.baseUrl).toBe('https://core.example.test')
  })

  it('en live, una URL inválida sigue lanzando al evaluar el módulo (la guarda está en main.tsx)', async () => {
    vi.stubEnv('VITE_CORE_API_URL', 'ftp://core.test')
    const dataSource = await import('./dataSource')
    dataSource.setDataSourceForTests('live')
    await expect(import('./client')).rejects.toThrow(/VITE_CORE_API_URL debe usar http o https/)
  })
})
