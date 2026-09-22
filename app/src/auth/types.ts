export interface AuthUser { id: string; email: string }

export interface AuthSession {
  user: AuthUser
  accessToken: string
  /**
   * HU30 (INTEROP-2.2 §6.8): provider token OAuth GitHub efímero, usado solo para descubrir
   * repositorios (`X-GitHub-Provider-Token`). Nunca se persiste fuera del estado de sesión ni se
   * muestra en UI/logs/fixtures. `null` cuando Supabase no lo entrega (p.ej. sesión restaurada tras recargar).
   */
  githubProviderToken: string | null
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthAdapter {
  getSession(): Promise<AuthSession | null>
  /**
   * HU62 (DEC-ORG-001): GitHub OAuth es el único método de acceso. `returnTo` es una ruta interna ya validada
   * (`safeReturnTo`) a la que OAuth vuelve tras autenticar. Devuelve la sesión si el adapter la establece de
   * inmediato (mock), o `null` si inició la redirección del navegador: entonces la sesión llega por `onAuthStateChange`.
   */
  signInWithGitHub(returnTo?: string): Promise<AuthSession | null>
  /**
   * `global` (cierre manual) revoca todas las sesiones del usuario; `local` (sesión rechazada por Core) solo esta. Lanza si el
   * proveedor devuelve error: quien llama decide qué hacer con el estado de la UI.
   */
  signOut(scope?: 'global' | 'local'): Promise<void>
  /** Devuelve una función de desuscripción, espejo de `supabase-js`. */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
