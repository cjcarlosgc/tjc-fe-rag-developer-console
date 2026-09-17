import { createClient } from '@supabase/supabase-js'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { invalidCredentialsMessage } from '../errors'
import type { AuthAdapter, AuthSession } from '../types'

/**
 * Sin proyecto Supabase real todavía (SDD 1.16): este adapter se construye contra el SDK oficial
 * pero no se prueba en vivo, solo con `vi.mock('@supabase/supabase-js')`. El cliente se crea de forma
 * perezosa: `createClient` valida la URL de inmediato y este módulo se importa siempre desde
 * `AuthProvider` (import estático), incluso cuando `VITE_AUTH_MODE=mock` — construirlo a nivel de
 * módulo rompería la app entera sin credenciales reales configuradas.
 */
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

function toSession(session: Session | null): AuthSession | null {
  if (!session) return null
  return {
    accessToken: session.access_token,
    user: { id: session.user.id, email: session.user.email ?? '' },
    githubProviderToken: session.provider_token ?? null,
  }
}

export const supabaseAuthAdapter: AuthAdapter = {
  async getSession() {
    const { data } = await getClient().auth.getSession()
    return toSession(data.session)
  },
  async signInWithPassword(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password })
    const session = toSession(data.session)
    if (error || !session) throw new Error(invalidCredentialsMessage)
    return session
  },
  /**
   * HU29 ampliado / HU30 (INTEROP-2.2 §6.8): `signInWithOAuth` redirige el navegador a GitHub; la
   * sesión llega después vía `onAuthStateChange`, no en este retorno. Pide scope `repo` para que
   * el `provider_token` resultante sirva luego para discovery de repositorios.
   */
  async signInWithGitHub() {
    const { error } = await getClient().auth.signInWithOAuth({ provider: 'github', options: { scopes: 'repo' } })
    if (error) throw new Error(invalidCredentialsMessage)
    const { data } = await getClient().auth.getSession()
    const session = toSession(data.session)
    if (!session) throw new Error(invalidCredentialsMessage)
    return session
  },
  /**
   * HU30 (no probado en vivo): `linkIdentity` vincula GitHub scope `repo` a la sesión de correo
   * existente sin crear otro usuario de plataforma, a diferencia de `signInWithOAuth`. Igual que
   * `signInWithGitHub`, redirige el navegador; la sesión vinculada llega después vía
   * `onAuthStateChange`.
   */
  async linkGitHub() {
    const { error } = await getClient().auth.linkIdentity({ provider: 'github', options: { scopes: 'repo' } })
    if (error) throw new Error(invalidCredentialsMessage)
    const { data } = await getClient().auth.getSession()
    const session = toSession(data.session)
    if (!session) throw new Error(invalidCredentialsMessage)
    return session
  },
  async signOut() {
    await getClient().auth.signOut()
  },
  async resetPasswordForEmail(email) {
    await getClient().auth.resetPasswordForEmail(email)
  },
  onAuthStateChange(callback) {
    const { data } = getClient().auth.onAuthStateChange((_event, session) => callback(toSession(session)))
    return () => data.subscription.unsubscribe()
  },
}
