/** Espejo exacto de `api/dataSource.ts`, pero para identidad en vez de datos. */
export type AuthMode = 'mock' | 'supabase'

let authModeOverride: AuthMode | null = null

export function getAuthMode(): AuthMode {
  if (authModeOverride) return authModeOverride
  const configured = import.meta.env.VITE_AUTH_MODE
  if (configured === 'supabase' || configured === 'mock') return configured
  return import.meta.env.MODE === 'test' ? 'supabase' : 'mock'
}

export function isMockAuth(): boolean {
  return getAuthMode() === 'mock'
}

export function setAuthModeForTests(value: AuthMode | null): void {
  authModeOverride = value
}
