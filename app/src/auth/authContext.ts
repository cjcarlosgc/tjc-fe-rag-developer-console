import { createContext } from 'react'
import type { AuthSession, AuthStatus } from './types'

export interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  signIn: (email: string, password: string) => Promise<void>
  signInWithGitHub: () => Promise<void>
  /** HU30: vincula GitHub a la sesión actual (típicamente de correo) sin cambiar de usuario. */
  linkGitHub: () => Promise<void>
  /** Fallo del callback OAuth (p.ej. GitHub ya vinculado a otro usuario), leído de la URL de retorno. */
  oauthError: string | null
  dismissOAuthError: () => void
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
