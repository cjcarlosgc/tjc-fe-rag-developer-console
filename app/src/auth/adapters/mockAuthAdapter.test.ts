import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockAuthAdapter } from './mockAuthAdapter'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('mockAuthAdapter', () => {
  it('signInWithPassword siempre persiste la identidad demostrativa, nunca el correo escrito', async () => {
    const session = await mockAuthAdapter.signInWithPassword('cualquiera@empresa.com', 'secret1')
    expect(session.user.email).toBe('demo@rag-test-studio.local')
    expect(await mockAuthAdapter.getSession()).toEqual(session)
  })

  it('rechaza credenciales que no cumplen el mínimo, con mensaje genérico', async () => {
    await expect(mockAuthAdapter.signInWithPassword('a@b.com', '123')).rejects.toThrow('No pudimos verificar tus credenciales. Revisa el correo y la contraseña.')
  })

  it('signOut limpia la sesión persistida', async () => {
    await mockAuthAdapter.signInWithPassword('a@b.com', 'secret1')
    await mockAuthAdapter.signOut()
    expect(await mockAuthAdapter.getSession()).toBeNull()
  })

  it('HU29 ampliado: signInWithGitHub persiste una identidad demo distinguible del login por contraseña', async () => {
    const session = await mockAuthAdapter.signInWithGitHub()
    expect(session.accessToken).toBe('mock-github-session-token')
    expect(await mockAuthAdapter.getSession()).toEqual(session)
  })
})
