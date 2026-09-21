import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockAuthAdapter } from './mockAuthAdapter'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('mockAuthAdapter', () => {
  it('HU62: signInWithGitHub persiste la única identidad demo (GitHub) con su provider token ficticio', async () => {
    const session = await mockAuthAdapter.signInWithGitHub()
    expect(session?.accessToken).toBe('mock-github-session-token')
    expect(session?.githubProviderToken).toBe('mock-github-provider-token')
    expect(session?.user.email).toBe('demo@rag-test-studio.local')
    expect(await mockAuthAdapter.getSession()).toEqual(session)
  })

  it('signOut limpia la sesión persistida', async () => {
    await mockAuthAdapter.signInWithGitHub()
    await mockAuthAdapter.signOut()
    expect(await mockAuthAdapter.getSession()).toBeNull()
  })

  it('HU62: no expone login por correo, vinculación de GitHub ni recuperación de contraseña', () => {
    expect(mockAuthAdapter).not.toHaveProperty('signInWithPassword')
    expect(mockAuthAdapter).not.toHaveProperty('linkGitHub')
    expect(mockAuthAdapter).not.toHaveProperty('resetPasswordForEmail')
  })
})
