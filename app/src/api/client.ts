export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly correlationId?: string,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const baseUrl = (import.meta.env.VITE_CORE_API_URL ?? '').replace(/\/$/, '')

let authTokenProvider: (() => string | null) | null = null
let authErrorHandler: ((event: AuthErrorEvent) => void) | null = null

/** HU62 (INTEROP-2.4 §6.13): fallo de identidad de Core, con el `code` del cuerpo para que el handler distinga sus causas. */
export interface AuthErrorEvent {
  status: 401 | 503
  code?: string
}

/** HU29: el `AuthProvider` registra cómo obtener el access token vigente, sin que `apiRequest` importe React. */
export function setAuthTokenProvider(provider: (() => string | null) | null): void {
  authTokenProvider = provider
}

/**
 * HU29/HU62: se dispara en `401` de sesión (`AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` o sin `code`) y en
 * `503 IDENTITY_UNAVAILABLE`, con el `code` del cuerpo; quien lo registra decide si cierra sesión o solo avisa.
 */
export function setAuthErrorHandler(handler: ((event: AuthErrorEvent) => void) | null): void {
  authErrorHandler = handler
}

/**
 * Un `401` cierra la sesión solo si es de sesión/identidad. Los `401 GITHUB_ACCOUNT_REQUIRED` y `GITHUB_USER_TOKEN_INVALID`
 * (discovery de repositorios, INTEROP §6.8) hablan del token OAuth de GitHub, no de la sesión de la Console: no se confunden con
 * un token expirado y se propagan como error normal (la UI ofrece «Renovar acceso a GitHub»).
 */
const SESSION_ENDING_401_CODES: ReadonlySet<string> = new Set(['AUTH_REQUIRED', 'INVALID_ACCESS_TOKEN', 'GITHUB_IDENTITY_REQUIRED'])

/** Mismo manejo de identidad para transportes que no pasan por `apiRequest` (handshake WebSocket, HU62). */
export function notifyAuthError(event: AuthErrorEvent): void {
  if (event.status === 401 && event.code && !SESSION_ENDING_401_CODES.has(event.code)) return
  authErrorHandler?.(event)
}

/** Access token vigente para transportes que no pasan por `apiRequest`. Nunca se registra en logs. */
export function getAuthToken(): string | null {
  return authTokenProvider?.() ?? null
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const correlationId = crypto.randomUUID()
  const accessToken = authTokenProvider?.() ?? null
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'x-correlation-id': correlationId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; code?: string; correlationId?: string; details?: unknown } | null
    if (response.status === 401) notifyAuthError({ status: 401, code: body?.code })
    else if (response.status === 503 && body?.code === 'IDENTITY_UNAVAILABLE') notifyAuthError({ status: 503, code: body.code })
    throw new ApiError(
      body?.message ?? `La solicitud falló con estado ${response.status}.`,
      response.status,
      body?.correlationId ?? response.headers.get('x-correlation-id') ?? correlationId,
      body?.code,
      body?.details,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
