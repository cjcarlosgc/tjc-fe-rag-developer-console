import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, setAuthTokenProvider, setUnauthorizedHandler } from './client'

afterEach(() => {
  setAuthTokenProvider(null)
  setUnauthorizedHandler(null)
  vi.restoreAllMocks()
})

describe('apiRequest — interceptor HU29', () => {
  it('agrega Authorization: Bearer cuando hay un access token', async () => {
    setAuthTokenProvider(() => 'token-123')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    await apiRequest('/ping')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-123')
  })

  it('no agrega Authorization cuando no hay token', async () => {
    setAuthTokenProvider(() => null)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await apiRequest('/ping')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('dispara el handler de 401 y nunca imprime el token en consola', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    setAuthTokenProvider(() => 'super-secret-token')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Sin sesión', code: 'AUTH_REQUIRED' }), { status: 401 }))

    await expect(apiRequest('/secure')).rejects.toThrow('Sin sesión')

    expect(handler).toHaveBeenCalledTimes(1)
    const loggedText = consoleSpy.mock.calls.flat().map(String).join(' ')
    expect(loggedText).not.toContain('super-secret-token')
    consoleSpy.mockRestore()
  })
})
