import { createClient } from '@supabase/supabase-js'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { githubLoginErrorMessage, githubSignOutErrorMessage } from '../errors'
import { safeReturnTo } from '../returnTo'
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
  /**
   * HU62 (DEC-ORG-001) / HU30 (INTEROP-2.2 §6.8): GitHub es el único método de acceso. `signInWithOAuth`
   * redirige el navegador a GitHub; la sesión llega después vía `onAuthStateChange`, no en este retorno
   * (por eso devuelve `null` y no lanza tras iniciar la redirección). Pide scope `repo` para que el
   * `provider_token` resultante sirva luego para discovery de repositorios. `redirectTo` vuelve a la ruta
   * interna validada (origin + `safeReturnTo`), nunca a un destino externo.
   */
  async signInWithGitHub(returnTo) {
    const path = safeReturnTo(returnTo ?? null) ?? '/'
    const { error } = await getClient().auth.signInWithOAuth({
      provider: 'github',
      options: { scopes: 'repo', redirectTo: `${window.location.origin}${path}` },
    })
    if (error) throw new Error(githubLoginErrorMessage)
    return null
  },
  /** `supabase.auth.signOut` no lanza: devuelve `{ error }`, que aquí se propaga sin exponer su detalle. */
  async signOut(scope = 'global') {
    const { error } = await getClient().auth.signOut({ scope })
    if (error) throw new Error(githubSignOutErrorMessage)
  },
  onAuthStateChange(callback) {
    const { data } = getClient().auth.onAuthStateChange((_event, session) => callback(toSession(session)))
    return () => data.subscription.unsubscribe()
  },
}
