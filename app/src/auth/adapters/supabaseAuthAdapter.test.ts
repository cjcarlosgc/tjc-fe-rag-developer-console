import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOAuth = vi.fn()
const getSession = vi.fn()
const signOut = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signInWithOAuth, getSession, signOut, onAuthStateChange } }),
}))

/**
 * SDD 1.16: sin proyecto Supabase real todavía, este adapter no se prueba en vivo — solo con
 * `vi.mock('@supabase/supabase-js')`, como este archivo.
 */
import { supabaseAuthAdapter } from './supabaseAuthAdapter'

beforeEach(() => {
  signInWithOAuth.mockReset()
  getSession.mockReset()
  signOut.mockReset()
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

  it('HU62: signInWithGitHub inicia OAuth con scope repo y redirectTo a la ruta interna, y devuelve null (la sesión llega por onAuthStateChange)', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    const result = await supabaseAuthAdapter.signInWithGitHub('/projects/prj_1/integrations/github?tab=x')
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { scopes: 'repo', redirectTo: `${window.location.origin}/projects/prj_1/integrations/github?tab=x` },
    })
    expect(result).toBeNull()
    expect(getSession).not.toHaveBeenCalled()
  })

  it('signInWithGitHub sin destino, o con uno externo, vuelve a la raíz del origen (sin open-redirect)', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    await supabaseAuthAdapter.signInWithGitHub()
    await supabaseAuthAdapter.signInWithGitHub('//evil.example/phish')
    await supabaseAuthAdapter.signInWithGitHub('https://evil.example')
    for (const [call] of signInWithOAuth.mock.calls) {
      expect(call.options.redirectTo).toBe(`${window.location.origin}/`)
    }
  })

  it('signInWithGitHub ante error de OAuth nunca expone el detalle de Supabase', async () => {
    signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'access_denied' } })
    await expect(supabaseAuthAdapter.signInWithGitHub()).rejects.toThrow('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.')
  })

  it('HU62: no expone login por correo, vinculación de GitHub ni recuperación de contraseña', () => {
    expect(supabaseAuthAdapter).not.toHaveProperty('signInWithPassword')
    expect(supabaseAuthAdapter).not.toHaveProperty('linkGitHub')
    expect(supabaseAuthAdapter).not.toHaveProperty('resetPasswordForEmail')
  })

  it('signOut usa alcance global por defecto y `local` cuando se pide', async () => {
    signOut.mockResolvedValue({ error: null })
    await supabaseAuthAdapter.signOut()
    await supabaseAuthAdapter.signOut('local')
    expect(signOut).toHaveBeenNthCalledWith(1, { scope: 'global' })
    expect(signOut).toHaveBeenNthCalledWith(2, { scope: 'local' })
  })

  it('signOut lanza (sin detalle del proveedor) cuando Supabase devuelve error, porque el SDK no lanza por sí mismo', async () => {
    signOut.mockResolvedValue({ error: { message: 'secret provider detail' } })
    await expect(supabaseAuthAdapter.signOut('local')).rejects.toThrow('No pudimos cerrar la sesión en el servidor')
    await expect(supabaseAuthAdapter.signOut('local')).rejects.not.toThrow(/secret provider detail/)
  })

  it('onAuthStateChange devuelve una función de desuscripción', () => {
    const unsubscribeFn = vi.fn()
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeFn } } })
    const unsubscribe = supabaseAuthAdapter.onAuthStateChange(() => {})
    unsubscribe()
    expect(unsubscribeFn).toHaveBeenCalledTimes(1)
  })
})
