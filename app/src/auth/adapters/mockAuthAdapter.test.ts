import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockAuthAdapter } from './mockAuthAdapter'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('mockAuthAdapter', () => {
  it('signInWithPassword siempre persiste la identidad demostrativa, nunca el correo escrito', async () => {
    const session = await mockAuthAdapter.signInWithPassword('cualquiera@empresa.com', 'secret1')
    expect(session.user.email).toBe('demo@rag-test-studio.local')
    expect(session.githubProviderToken).toBeNull()
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
    expect(session.githubProviderToken).toBe('mock-github-provider-token')
    expect(await mockAuthAdapter.getSession()).toEqual(session)
  })

  it('HU30: linkGitHub agrega el provider token a una sesión de correo sin cambiar de usuario', async () => {
    const emailSession = await mockAuthAdapter.signInWithPassword('a@b.com', 'secret1')
    const linked = await mockAuthAdapter.linkGitHub()
    expect(linked.user).toEqual(emailSession.user)
    expect(linked.accessToken).toBe(emailSession.accessToken)
    expect(linked.githubProviderToken).toBe('mock-github-provider-token')
    expect(await mockAuthAdapter.getSession()).toEqual(linked)
  })

  it('linkGitHub sin sesión activa lanza', async () => {
    await expect(mockAuthAdapter.linkGitHub()).rejects.toThrow('No hay una sesión activa para vincular GitHub.')
  })
})
