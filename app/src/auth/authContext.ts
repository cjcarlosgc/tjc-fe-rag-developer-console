import { createContext } from 'react'
import type { AuthSession, AuthStatus } from './types'

/**
 * HU62 (INTEROP-2.4 §6.13): aviso de identidad originado por Core. `expired` y `identity-required` cerraron la
 * sesión (se muestran en `/login`); `identity-unavailable` NO la cerró y se reintenta desde el shell.
 */
export interface SessionNotice {
  kind: 'expired' | 'identity-required' | 'identity-unavailable'
  message: string
}

export interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  /**
   * HU62: único método de acceso. `returnTo` es una ruta interna ya validada. Devuelve `true` si la sesión quedó
   * establecida (mock) y `false` si el navegador está siendo redirigido a GitHub (la sesión llega al volver).
   */
  signInWithGitHub: (returnTo?: string) => Promise<boolean>
  /** Fallo del callback OAuth (p.ej. acceso denegado en GitHub), leído de la URL de retorno. */
  oauthError: string | null
  dismissOAuthError: () => void
  sessionNotice: SessionNotice | null
  dismissSessionNotice: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
