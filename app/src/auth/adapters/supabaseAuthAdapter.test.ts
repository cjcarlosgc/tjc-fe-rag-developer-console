import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signInWithOAuth = vi.fn()
const linkIdentity = vi.fn()
const getUserIdentities = vi.fn()
const getSession = vi.fn()
const signOut = vi.fn()
const resetPasswordForEmail = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signInWithPassword, signInWithOAuth, linkIdentity, getUserIdentities, getSession, signOut, resetPasswordForEmail, onAuthStateChange } }),
}))

/**
 * SDD 1.16: sin proyecto Supabase real todavía, este adapter no se prueba en vivo — solo con
 * `vi.mock('@supabase/supabase-js')`, como este archivo.
 */
import { supabaseAuthAdapter } from './supabaseAuthAdapter'

beforeEach(() => {
  signInWithPassword.mockReset()
  signInWithOAuth.mockReset()
  linkIdentity.mockReset()
  getUserIdentities.mockReset()
  getUserIdentities.mockResolvedValue({ data: { identities: [{ provider: 'email' }] }, error: null })
  getSession.mockReset()
  signOut.mockReset()
  resetPasswordForEmail.mockReset()
  onAuthStateChange.mockReset()
})

describe('supabaseAuthAdapter (no probado en vivo)', () => {
  it('mapea una sesión válida del SDK a AuthSession', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-abc', user: { id: 'u1', email: 'real@empresa.com' } } } })
    expect(await supabaseAuthAdapter.getSession()).toEqual({ accessToken: 'jwt-abc', user: { id: 'u1', email: 'real@empresa.com' }, githubProviderToken: null })
  })

  it('HU30: mapea provider_token a githubProviderToken cuando el SDK lo trae', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-abc', provider_token: 'gho_demo', user: { id: 'u1', email: 'real@empresa.com' } } } })
    expect(await supabaseAuthAdapter.getSession()).toEqual({ accessToken: 'jwt-abc', user: { id: 'u1', email: 'real@empresa.com' }, githubProviderToken: 'gho_demo' })
  })

  it('getSession sin sesión activa devuelve null', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    expect(await supabaseAuthAdapter.getSession()).toBeNull()
  })

  it('signInWithPassword ante error nunca expone el detalle de Supabase (mensaje genérico)', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } })
    await expect(supabaseAuthAdapter.signInWithPassword('a@b.com', 'wrong')).rejects.toThrow('No pudimos verificar tus credenciales. Revisa el correo y la contraseña.')
  })

  it('signInWithPassword exitoso devuelve la sesión mapeada', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'jwt-xyz', user: { id: 'u2', email: 'real@empresa.com' } } }, error: null })
    const session = await supabaseAuthAdapter.signInWithPassword('real@empresa.com', 'secret1')
    expect(session.accessToken).toBe('jwt-xyz')
  })

  it('HU29 ampliado: signInWithGitHub delega en signInWithOAuth con scope repo y devuelve la sesión ya establecida', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-gh', user: { id: 'u3', email: 'real@empresa.com' } } } })
    const session = await supabaseAuthAdapter.signInWithGitHub()
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'github', options: { scopes: 'repo' } })
    expect(session.accessToken).toBe('jwt-gh')
  })

  it('signInWithGitHub ante error de OAuth nunca expone el detalle de Supabase', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'access_denied' } })
    await expect(supabaseAuthAdapter.signInWithGitHub()).rejects.toThrow('No pudimos verificar tus credenciales. Revisa el correo y la contraseña.')
  })

  it('HU30: linkGitHub delega en linkIdentity con scope repo y devuelve la sesión vinculada', async () => {
    linkIdentity.mockResolvedValue({ data: {}, error: null })
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-email', provider_token: 'gho_linked', user: { id: 'u4', email: 'real@empresa.com' } } } })
    const session = await supabaseAuthAdapter.linkGitHub()
    expect(linkIdentity).toHaveBeenCalledWith({ provider: 'github', options: { scopes: 'repo' } })
    expect(session.githubProviderToken).toBe('gho_linked')
  })

  it('linkGitHub reautoriza con signInWithOAuth si GitHub ya está vinculado al usuario actual, sin llamar a linkIdentity', async () => {
    getUserIdentities.mockResolvedValue({ data: { identities: [{ provider: 'email' }, { provider: 'github' }] }, error: null })
    signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-email', provider_token: 'gho_fresh', user: { id: 'u4', email: 'real@empresa.com' } } } })
    const session = await supabaseAuthAdapter.linkGitHub()
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'github', options: { scopes: 'repo' } })
    expect(linkIdentity).not.toHaveBeenCalled()
    expect(session.githubProviderToken).toBe('gho_fresh')
  })

  it('linkGitHub ante error nunca expone el detalle de Supabase', async () => {
    linkIdentity.mockResolvedValue({ data: {}, error: { message: 'identity_already_exists' } })
    await expect(supabaseAuthAdapter.linkGitHub()).rejects.toThrow('No pudimos conectar tu cuenta de GitHub. Inténtalo de nuevo.')
  })

  it('onAuthStateChange devuelve una función de desuscripción', () => {
    const unsubscribeFn = vi.fn()
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeFn } } })
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange(() => {})
    unsubscribe()
    expect(unsubscribeFn).toHaveBeenCalledTimes(1)
  })
})
