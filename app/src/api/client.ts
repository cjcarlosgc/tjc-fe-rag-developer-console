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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const correlationId = crypto.randomUUID()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'x-correlation-id': correlationId,
      ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; code?: string; correlationId?: string; details?: unknown } | null
    throw new ApiError(
      body?.message ?? `La solicitud falló con estado ${response.status}.`,
      response.status,
      body?.correlationId ?? response.headers.get('x-correlation-id') ?? correlationId,
      body?.code,
      body?.details,
    )
  }

  return response.json() as Promise<T>
}
