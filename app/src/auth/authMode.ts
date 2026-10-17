import { getDataSource } from '../api/dataSource'

/**
 * Identidad, análoga a `api/dataSource.ts`. `VITE_AUTH_MODE` es opcional: sin definir, el modo se
 * deriva de la fuente de datos (`live` → supabase, `mock` → mock), así un despliegue live (Render)
 * solo necesita `VITE_DATA_SOURCE=live`. Definirla explícitamente sirve en local para forzar un
 * modo; la combinación inválida (mock + datos live) sigue bloqueada en `AuthProvider`.
 */
export type AuthMode = 'mock' | 'supabase'

let authModeOverride: AuthMode | null = null

export function getAuthMode(): AuthMode {
  if (authModeOverride) return authModeOverride
  const configured = import.meta.env.VITE_AUTH_MODE
  if (configured === 'supabase' || configured === 'mock') return configured
  return getDataSource() === 'live' ? 'supabase' : 'mock'
}

export function isMockAuth(): boolean {
  return getAuthMode() === 'mock'
}

export function setAuthModeForTests(value: AuthMode | null): void {
  authModeOverride = value
}
