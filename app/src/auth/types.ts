export interface AuthUser { id: string; email: string }
export interface AuthSession { user: AuthUser; accessToken: string }
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthAdapter {
  getSession(): Promise<AuthSession | null>
  signInWithPassword(email: string, password: string): Promise<AuthSession>
  signOut(): Promise<void>
  resetPasswordForEmail(email: string): Promise<void>
  /** Devuelve una función de desuscripción, espejo de `supabase-js`. */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
