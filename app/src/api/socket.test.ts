import { io } from 'socket.io-client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setAuthErrorHandler, setAuthTokenProvider } from './client'

type Handler = (...args: unknown[]) => void

const handlers = new Map<string, Set<Handler>>()
const emitted: Array<[string, unknown]> = []
const mockSocket = {
  connected: false,
  on: vi.fn((event: string, handler: Handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
  }),
  off: vi.fn((event: string, handler: Handler) => {
    handlers.get(event)?.delete(handler)
  }),
  emit: vi.fn((event: string, payload: unknown) => {
    emitted.push([event, payload])
  }),
  disconnect: vi.fn(),
  connect: vi.fn(),
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

function trigger(event: string, payload?: unknown) {
  if (event === 'connect') mockSocket.connected = true
  handlers.get(event)?.forEach((handler) => handler(payload))
}

let socket: typeof import('./socket')

beforeEach(async () => {
  vi.mocked(io).mockClear()
  mockSocket.connect.mockClear()
  mockSocket.disconnect.mockClear()
  handlers.clear()
  emitted.length = 0
  mockSocket.connected = false
  socket = await import('./socket')
  socket.resetSocketForTests()
})

afterEach(() => {
  socket.resetSocketForTests()
  setAuthTokenProvider(null)
  setAuthErrorHandler(null)
  vi.useRealTimers()
})

test('HU21: emite subscribe al conectar y filtra actualizaciones por id', () => {
  const onUpdate = vi.fn()
  const unsubscribe = socket.subscribeProjectVersionUpdates<{ id: string; status: string }>('pv-1', onUpdate)

  trigger('connect')
  expect(emitted).toContainEqual(['subscribe:project-version', { projectVersionId: 'pv-1' }])

  trigger('project-version:update', { id: 'pv-2', status: 'PENDING' })
  expect(onUpdate).not.toHaveBeenCalled()

  trigger('project-version:update', { id: 'pv-1', status: 'COMPLETED' })
  expect(onUpdate).toHaveBeenCalledWith({ id: 'pv-1', status: 'COMPLETED' })

  unsubscribe()
  expect(emitted).toContainEqual(['unsubscribe:project-version', { projectVersionId: 'pv-1' }])
})

test('HU22: si ya está conectado, suscribe de inmediato sin esperar el evento connect', () => {
  mockSocket.connected = true
  const onUpdate = vi.fn()
  socket.subscribeTestRunUpdates('run-1', onUpdate)
  expect(emitted).toContainEqual(['subscribe:test-run', { testRunId: 'run-1' }])
})

test('una reconexión vuelve a emitir subscribe para el mismo id', () => {
  const onUpdate = vi.fn()
  socket.subscribeProjectVersionUpdates('pv-9', onUpdate)
  trigger('connect')
  trigger('connect')
  const subscribeCalls = emitted.filter(([event]) => event === 'subscribe:project-version')
  expect(subscribeCalls).toHaveLength(2)
})

/** `auth` de `io(...)` es una función: socket.io la invoca en cada (re)conexión. */
function handshakeAuth(): Record<string, unknown> {
  const options = vi.mocked(io).mock.calls[0][1] as { auth: (callback: (data: Record<string, unknown>) => void) => void }
  let data: Record<string, unknown> = {}
  options.auth((next) => { data = next })
  return data
}

test('HU62: el handshake envía el access token vigente en auth.token, leído en cada conexión', () => {
  let token: string | null = 'jwt-1'
  setAuthTokenProvider(() => token)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  expect(handshakeAuth()).toEqual({ token: 'jwt-1' })
  token = 'jwt-2'
  expect(handshakeAuth()).toEqual({ token: 'jwt-2' })
})

test('HU62: sin token el handshake no envía auth.token', () => {
  setAuthTokenProvider(() => null)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  expect(handshakeAuth()).toEqual({})
})

function handshakeError(code: string, retryable: boolean) {
  return Object.assign(new Error(code), { data: { code, message: 'no se usa', retryable } })
}

test('HU62: connect_error retryable (IDENTITY_UNAVAILABLE) llama a connect() con backoff acotado y se rinde tras el máximo', () => {
  vi.useFakeTimers()
  const handler = vi.fn()
  setAuthErrorHandler(handler)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())

  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  expect(mockSocket.connect).not.toHaveBeenCalled()
  vi.advanceTimersByTime(999)
  expect(mockSocket.connect).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)

  // Segundo intento: espera duplicada.
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  vi.advanceTimersByTime(1_999)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(mockSocket.connect).toHaveBeenCalledTimes(2)

  for (let attempt = 3; attempt <= 5; attempt += 1) {
    trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
    vi.advanceTimersByTime(30_000)
  }
  expect(mockSocket.connect).toHaveBeenCalledTimes(5)

  // Agotado el máximo, no reintenta más (HTTP queda de fallback) y descarta el socket.
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  vi.advanceTimersByTime(60_000)
  expect(mockSocket.connect).toHaveBeenCalledTimes(5)
  expect(mockSocket.disconnect).toHaveBeenCalled()
  // El aviso de identidad no disponible es asunto de HTTP: el socket no cierra sesión ni avisa.
  expect(handler).not.toHaveBeenCalled()
})

test('HU62: una conexión exitosa reinicia el backoff', () => {
  vi.useFakeTimers()
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  vi.advanceTimersByTime(1_000)
  trigger('connect')
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  vi.advanceTimersByTime(999)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(mockSocket.connect).toHaveBeenCalledTimes(2)
})

test.each(['GITHUB_IDENTITY_REQUIRED', 'INVALID_ACCESS_TOKEN'])('HU62: connect_error %s (no reintentable) dispara el manejo de sesión, sin reintentar ni bucle', (code) => {
  vi.useFakeTimers()
  const handler = vi.fn()
  setAuthErrorHandler(handler)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())

  trigger('connect_error', handshakeError(code, false))
  vi.advanceTimersByTime(120_000)

  expect(handler).toHaveBeenCalledTimes(1)
  expect(handler).toHaveBeenCalledWith({ status: 401, code })
  expect(mockSocket.connect).not.toHaveBeenCalled()
})

test('un connect_error de transporte (sin data) lo reintenta socket.io: la Console no interviene', () => {
  vi.useFakeTimers()
  const handler = vi.fn()
  setAuthErrorHandler(handler)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', new Error('xhr poll error'))
  vi.advanceTimersByTime(120_000)
  expect(handler).not.toHaveBeenCalled()
  expect(mockSocket.connect).not.toHaveBeenCalled()
})

test('HU62: tras un rechazo de identidad la próxima suscripción crea un socket nuevo con el token vigente', () => {
  setAuthErrorHandler(vi.fn())
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', handshakeError('GITHUB_IDENTITY_REQUIRED', false))
  socket.subscribeProjectVersionUpdates('pv-2', vi.fn())
  expect(vi.mocked(io)).toHaveBeenCalledTimes(2)
})

test('HU62: A → logout → B no reutiliza la conexión de A: resetSocket descarta el socket y B se conecta con su token', () => {
  let token: string | null = 'jwt-A'
  setAuthTokenProvider(() => token)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  expect(handshakeAuth()).toEqual({ token: 'jwt-A' })
  expect(vi.mocked(io)).toHaveBeenCalledTimes(1)

  socket.resetSocket()
  expect(mockSocket.disconnect).toHaveBeenCalled()
  token = 'jwt-B'
  socket.subscribeProjectVersionUpdates('pv-2', vi.fn())

  expect(vi.mocked(io)).toHaveBeenCalledTimes(2)
  const secondOptions = vi.mocked(io).mock.calls[1][1] as { auth: (callback: (data: Record<string, unknown>) => void) => void }
  let data: Record<string, unknown> = {}
  secondOptions.auth((next) => { data = next })
  expect(data).toEqual({ token: 'jwt-B' })
})

test('resetSocket cancela un reintento pendiente (no queda un connect() colgando tras el logout)', () => {
  vi.useFakeTimers()
  setAuthErrorHandler(vi.fn())
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE', true))
  socket.resetSocket()
  vi.advanceTimersByTime(60_000)
  expect(mockSocket.connect).not.toHaveBeenCalled()
})

test('HU62: token renovado del mismo usuario → renewSocketAuth reconecta el mismo socket (relee el token) y conserva las suscripciones', () => {
  let token: string | null = 'jwt-1'
  setAuthTokenProvider(() => token)
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect')
  emitted.length = 0

  token = 'jwt-2'
  socket.renewSocketAuth()
  expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)
  expect(vi.mocked(io)).toHaveBeenCalledTimes(1)
  expect(handshakeAuth()).toEqual({ token: 'jwt-2' })

  // Al reconectar, la suscripción vigente se vuelve a emitir.
  trigger('connect')
  expect(emitted).toContainEqual(['subscribe:project-version', { projectVersionId: 'pv-1' }])
})

test('renewSocketAuth sin socket creado no hace nada', () => {
  socket.renewSocketAuth()
  expect(mockSocket.connect).not.toHaveBeenCalled()
  expect(vi.mocked(io)).not.toHaveBeenCalled()
})
