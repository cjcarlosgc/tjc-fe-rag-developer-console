export interface AuthUser { id: string; email: string }

export interface AuthSession {
  user: AuthUser
  accessToken: string
  /**
   * HU30 (INTEROP-2.2 §6.8): provider token OAuth GitHub efímero, usado solo para descubrir
   * repositorios (`X-GitHub-Provider-Token`). Nunca se persiste fuera del estado de sesión ni se
   * muestra en UI/logs/fixtures. `null` cuando la sesión no tiene GitHub vinculado.
   */
  githubProviderToken: string | null
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthAdapter {
  getSession(): Promise<AuthSession | null>
  signInWithPassword(email: string, password: string): Promise<AuthSession>
  /** HU29 ampliado: login alternativo vía GitHub OAuth, separado del binding de repositorio (HU30). */
  signInWithGitHub(): Promise<AuthSession>
  /** HU30: vincula GitHub (scope `repo`) a una sesión de correo ya iniciada, sin cambiar de usuario de plataforma. */
  linkGitHub(): Promise<AuthSession>
  signOut(): Promise<void>
  resetPasswordForEmail(email: string): Promise<void>
  /** Devuelve una función de desuscripción, espejo de `supabase-js`. */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
