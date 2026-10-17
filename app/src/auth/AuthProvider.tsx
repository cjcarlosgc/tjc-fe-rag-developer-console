import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { isMockDataSource } from '../api/dataSource'
import { setAuthErrorHandler, setAuthTokenProvider } from '../api/client'
import type { AuthErrorEvent } from '../api/client'
import { renewSocketAuth, resetSocket } from '../api/socket'
import { AuthContext } from './authContext'
import type { SessionNotice } from './authContext'
import { isMockAuth } from './authMode'
import { mockAuthAdapter } from './adapters/mockAuthAdapter'
import { supabaseAuthAdapter } from './adapters/supabaseAuthAdapter'
import { githubIdentityRequiredMessage, identityUnavailableMessage, sessionExpiredMessage } from './errors'
import { clearOAuthCallbackError, readOAuthCallbackError } from './oauthCallbackError'
import type { AuthSession, AuthStatus } from './types'

function activeAdapter() {
  return isMockAuth() ? mockAuthAdapter : supabaseAuthAdapter
}

/**
 * spec.md HU29: `VITE_AUTH_MODE=mock` solo puede usarse junto con `VITE_DATA_SOURCE=mock`.
 * El chequeo va aquí (antes de montar cualquier ruta real), no por-ruta, para que no se pueda saltar con un deep link.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const blocked = isMockAuth() && !isMockDataSource()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [oauthError, setOAuthError] = useState<string | null>(readOAuthCallbackError)
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null)
  // Varias consultas en vuelo pueden fallar con 401 a la vez: solo la primera cierra la sesión. Se mantiene junto al estado (no en un efecto) para que no dependa del timing de render.
  const sessionRef = useRef<AuthSession | null>(null)
  const applySession = useCallback((next: AuthSession | null) => {
    const previous = sessionRef.current
    sessionRef.current = next
    // El token del WebSocket solo se lee en el handshake: otro usuario (o ninguno) no puede reutilizar la conexión anterior, y un token renovado del mismo usuario reconecta con el vigente.
    if (!next || previous?.user.id !== next.user.id) resetSocket()
    else if (previous.accessToken !== next.accessToken) renewSocketAuth()
    setSession(next)
    setStatus(next ? 'authenticated' : 'unauthenticated')
  }, [])

  useEffect(() => {
    clearOAuthCallbackError()
  }, [])

  const dismissOAuthError = useCallback(() => setOAuthError(null), [])
  const dismissSessionNotice = useCallback(() => setSessionNotice(null), [])

  useEffect(() => {
    if (blocked) return
    let active = true
    activeAdapter().getSession()
      .then((restored) => {
        if (active) applySession(restored)
      })
      .catch(() => {
        if (active) setStatus('unauthenticated')
      })
    // El adapter supabase valida su configuración en el primer uso; sin credenciales reales
    // (SDD 1.16: adapter no probado en vivo) esto puede lanzar de forma síncrona.
    let unsubscribe = () => {}
    try {
      unsubscribe = activeAdapter().onAuthStateChange(applySession)
    } catch {
      queueMicrotask(() => { if (active) setStatus('unauthenticated') })
    }
    return () => { active = false; unsubscribe() }
  }, [blocked, applySession])

  /**
   * Sincroniza el proveedor de Bearer para `apiRequest` durante el render, no en un `useEffect`:
   * React ejecuta los efectos de hijos antes que los de padres dentro del mismo commit, así que un
   * `useEffect([session])` acá corre DESPUÉS del efecto de montaje de una ruta hija recién habilitada
   * por `RequireAuth` (p.ej. la primera vez que `status` pasa a `authenticated`) — esa ruta podía
   * disparar su primera consulta sin token todavía, forzando un 401 -> logout automático espurio.
   * Esta asignación es una simple actualización de un valor externo (no afecta lo que se renderiza),
   * por lo que es segura de ejecutar en el cuerpo del componente, incluida la doble invocación de
   * StrictMode en desarrollo.
   */
  setAuthTokenProvider(() => session?.accessToken ?? null)

  /**
   * HU62 (INTEROP-2.4 §6.13). `503 IDENTITY_UNAVAILABLE` no toca la sesión: solo avisa para reintentar.
   * Todo `401` cierra la sesión también en Supabase (si no, `getSession` la restauraría con un token que Core
   * rechaza). `GITHUB_IDENTITY_REQUIRED` es terminal: mensaje persistente en `/login` y NUNCA redirección
   * automática a GitHub (el vínculo es inmutable y reintentar con la misma cuenta produciría un bucle).
   * No se registra ni se muestra el token ni los claims.
   */
  useEffect(() => {
    setAuthErrorHandler(({ status, code }: AuthErrorEvent) => {
      if (status === 503) {
        setSessionNotice({ kind: 'identity-unavailable', message: identityUnavailableMessage })
        return
      }
      if (!sessionRef.current) return
      setSessionNotice(code === 'GITHUB_IDENTITY_REQUIRED'
        ? { kind: 'identity-required', message: githubIdentityRequiredMessage }
        : { kind: 'expired', message: sessionExpiredMessage })
      applySession(null)
      // `local`: Core rechazó esta sesión, no hay por qué revocar las demás del usuario. La UI ya quedó cerrada aunque falle.
      void activeAdapter().signOut('local').catch(() => {})
    })
    return () => setAuthErrorHandler(null)
  }, [applySession])

  const signInWithGitHub = useCallback(async (returnTo?: string) => {
    setSessionNotice(null)
    setOAuthError(null)
    const next = await activeAdapter().signInWithGitHub(returnTo)
    if (!next) return false
    applySession(next)
    return true
  }, [applySession])

  // Cierre manual (global). Si el proveedor falla, la UI igualmente queda sin sesión: no se conserva un estado autenticado que el usuario ya pidió cerrar.
  const signOut = useCallback(async () => {
    try {
      await activeAdapter().signOut('global')
    } catch {
      // Sin detalle del proveedor; el estado local se cierra abajo.
    }
    setSessionNotice(null)
    applySession(null)
  }, [applySession])

  const value = useMemo(
    () => ({ status, session, signInWithGitHub, oauthError, dismissOAuthError, sessionNotice, dismissSessionNotice, signOut }),
    [status, session, signInWithGitHub, oauthError, dismissOAuthError, sessionNotice, dismissSessionNotice, signOut],
  )

  if (blocked) {
    return <div className="auth-block-screen" role="alert">
      <h1>Combinación de entorno no permitida</h1>
      <p>La identidad demostrativa (<code>VITE_AUTH_MODE=mock</code>) solo puede usarse junto con datos simulados (<code>VITE_DATA_SOURCE=mock</code>). Ajusta las variables de entorno para continuar; esta pantalla no tiene un formulario alcanzable a propósito.</p>
    </div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
