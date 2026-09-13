import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isMockDataSource } from '../api/dataSource'
import { setAuthTokenProvider, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './authContext'
import { isMockAuth } from './authMode'
import { mockAuthAdapter } from './adapters/mockAuthAdapter'
import { supabaseAuthAdapter } from './adapters/supabaseAuthAdapter'
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

  useEffect(() => {
    if (blocked) return
    let active = true
    activeAdapter().getSession()
      .then((restored) => {
        if (!active) return
        setSession(restored)
        setStatus(restored ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (active) setStatus('unauthenticated')
      })
    // El adapter supabase valida su configuración en el primer uso; sin credenciales reales
    // (SDD 1.16: adapter no probado en vivo) esto puede lanzar de forma síncrona.
    let unsubscribe = () => {}
    try {
      unsubscribe = activeAdapter().onAuthStateChange((next) => {
        setSession(next)
        setStatus(next ? 'authenticated' : 'unauthenticated')
      })
    } catch {
      queueMicrotask(() => { if (active) setStatus('unauthenticated') })
    }
    return () => { active = false; unsubscribe() }
  }, [blocked])

  useEffect(() => {
    setAuthTokenProvider(() => session?.accessToken ?? null)
  }, [session])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null)
      setStatus('unauthenticated')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await activeAdapter().signInWithPassword(email, password)
    setSession(next)
    setStatus('authenticated')
  }, [])

  const signInWithGitHub = useCallback(async () => {
    const next = await activeAdapter().signInWithGitHub()
    setSession(next)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    await activeAdapter().signOut()
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const requestPasswordReset = useCallback((email: string) => activeAdapter().resetPasswordForEmail(email), [])

  const value = useMemo(
    () => ({ status, session, signIn, signInWithGitHub, signOut, requestPasswordReset }),
    [status, session, signIn, signInWithGitHub, signOut, requestPasswordReset],
  )

  if (blocked) {
    return <div className="auth-block-screen" role="alert">
      <h1>Combinación de entorno no permitida</h1>
      <p>La identidad demostrativa (<code>VITE_AUTH_MODE=mock</code>) solo puede usarse junto con datos simulados (<code>VITE_DATA_SOURCE=mock</code>). Ajusta las variables de entorno para continuar; esta pantalla no tiene un formulario alcanzable a propósito.</p>
    </div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
