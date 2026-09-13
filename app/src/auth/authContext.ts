import { createContext } from 'react'
import type { AuthSession, AuthStatus } from './types'

export interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  signIn: (email: string, password: string) => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
