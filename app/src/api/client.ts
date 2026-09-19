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
let unauthorizedHandler: (() => void) | null = null

/** HU29: el `AuthProvider` registra cómo obtener el access token vigente, sin que `apiRequest` importe React. */
export function setAuthTokenProvider(provider: (() => string | null) | null): void {
  authTokenProvider = provider
}

/** HU29: se dispara en `401 AUTH_REQUIRED`/`INVALID_ACCESS_TOKEN` para forzar reautenticación. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
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
    if (response.status === 401) unauthorizedHandler?.()
    const body = await response.json().catch(() => null) as { message?: string; code?: string; correlationId?: string; details?: unknown } | null
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
