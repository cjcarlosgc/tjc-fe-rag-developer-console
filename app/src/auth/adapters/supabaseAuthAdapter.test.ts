import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signInWithOAuth = vi.fn()
const getSession = vi.fn()
const signOut = vi.fn()
const resetPasswordForEmail = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signInWithPassword, signInWithOAuth, getSession, signOut, resetPasswordForEmail, onAuthStateChange } }),
}))

/**
 * SDD 1.16: sin proyecto Supabase real todavía, este adapter no se prueba en vivo — solo con
 * `vi.mock('@supabase/supabase-js')`, como este archivo.
 */
import { supabaseAuthAdapter } from './supabaseAuthAdapter'

beforeEach(() => {
  signInWithPassword.mockReset()
  signInWithOAuth.mockReset()
  getSession.mockReset()
  signOut.mockReset()
  resetPasswordForEmail.mockReset()
  onAuthStateChange.mockReset()
})

describe('supabaseAuthAdapter (no probado en vivo)', () => {
  it('mapea una sesión válida del SDK a AuthSession', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-abc', user: { id: 'u1', email: 'real@empresa.com' } } } })
    expect(await supabaseAuthAdapter.getSession()).toEqual({ accessToken: 'jwt-abc', user: { id: 'u1', email: 'real@empresa.com' } })
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

  it('HU29 ampliado: signInWithGitHub delega en signInWithOAuth y devuelve la sesión ya establecida', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-gh', user: { id: 'u3', email: 'real@empresa.com' } } } })
    const session = await supabaseAuthAdapter.signInWithGitHub()
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'github' })
    expect(session.accessToken).toBe('jwt-gh')
  })

  it('signInWithGitHub ante error de OAuth nunca expone el detalle de Supabase', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'access_denied' } })
    await expect(supabaseAuthAdapter.signInWithGitHub()).rejects.toThrow('No pudimos verificar tus credenciales. Revisa el correo y la contraseña.')
  })

  it('onAuthStateChange devuelve una función de desuscripción', () => {
    const unsubscribeFn = vi.fn()
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeFn } } })
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange(() => {})
    unsubscribe()
    expect(unsubscribeFn).toHaveBeenCalledTimes(1)
  })
})
