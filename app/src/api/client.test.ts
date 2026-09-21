import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, setAuthErrorHandler, setAuthTokenProvider } from './client'

afterEach(() => {
  setAuthTokenProvider(null)
  setAuthErrorHandler(null)
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

  it('dispara el handler de 401 con el code del cuerpo y nunca imprime el token en consola', async () => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    setAuthTokenProvider(() => 'super-secret-token')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Sin sesión', code: 'AUTH_REQUIRED' }), { status: 401 }))

    await expect(apiRequest('/secure')).rejects.toThrow('Sin sesión')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ status: 401, code: 'AUTH_REQUIRED' })
    const loggedText = consoleSpy.mock.calls.flat().map(String).join(' ')
    expect(loggedText).not.toContain('super-secret-token')
    consoleSpy.mockRestore()
  })

  it('HU62: 401 GITHUB_IDENTITY_REQUIRED entrega su code al handler y lanza ApiError con el code', async () => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Falta identidad GitHub', code: 'GITHUB_IDENTITY_REQUIRED' }), { status: 401 }))

    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 401, code: 'GITHUB_IDENTITY_REQUIRED' })

    expect(handler).toHaveBeenCalledWith({ status: 401, code: 'GITHUB_IDENTITY_REQUIRED' })
  })

  it('un 401 sin cuerpo JSON sigue disparando el handler (sin code)', async () => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>proxy</html>', { status: 401 }))

    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 401 })

    expect(handler).toHaveBeenCalledWith({ status: 401, code: undefined })
  })

  it('HU62: 503 IDENTITY_UNAVAILABLE avisa al handler (reintentable) y otros 503 no lo disparan', async () => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Identidad no disponible', code: 'IDENTITY_UNAVAILABLE' }), { status: 503 }))
    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 503, code: 'IDENTITY_UNAVAILABLE' })
    expect(handler).toHaveBeenCalledWith({ status: 503, code: 'IDENTITY_UNAVAILABLE' })

    handler.mockClear()
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Otro', code: 'GITHUB_VERIFICATION_UNAVAILABLE' }), { status: 503 }))
    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 503 })
    expect(handler).not.toHaveBeenCalled()
  })

  it.each(['GITHUB_ACCOUNT_REQUIRED', 'GITHUB_USER_TOKEN_INVALID'])('401 %s (token OAuth de GitHub, discovery) NO dispara el handler de sesión y se propaga como error normal', async (code) => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Token GitHub inválido', code }), { status: 401 }))

    await expect(apiRequest('/integrations/github/repositories')).rejects.toMatchObject({ status: 401, code })

    expect(handler).not.toHaveBeenCalled()
  })

  it.each(['AUTH_REQUIRED', 'INVALID_ACCESS_TOKEN', 'GITHUB_IDENTITY_REQUIRED'])('401 %s sí dispara el handler de sesión', async (code) => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'x', code }), { status: 401 }))
    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledWith({ status: 401, code })
  })

  it('un 403 no dispara el handler de identidad', async () => {
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'No', code: 'FORBIDDEN' }), { status: 403 }))
    await expect(apiRequest('/secure')).rejects.toMatchObject({ status: 403 })
    expect(handler).not.toHaveBeenCalled()
  })
})
