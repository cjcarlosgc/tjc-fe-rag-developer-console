import { io } from 'socket.io-client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setAuthErrorHandler, setAuthTokenProvider } from './client'

type Handler = (...args: unknown[]) => void
type AckCallback = (value: unknown) => void

const handlers = new Map<string, Set<Handler>>()
const emitted: Array<[string, unknown]> = []
const pendingAcks: Array<{ event: string; respond: AckCallback }> = []
const mockSocket = {
  connected: false,
  on: vi.fn((event: string, handler: Handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
  }),
  off: vi.fn((event: string, handler: Handler) => {
    handlers.get(event)?.delete(handler)
  }),
  emit: vi.fn((event: string, payload: unknown, ack?: AckCallback) => {
    emitted.push([event, payload])
    if (ack) pendingAcks.push({ event, respond: ack })
  }),
  disconnect: vi.fn(),
  connect: vi.fn(),
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

function trigger(event: string, payload?: unknown) {
  if (event === 'connect') mockSocket.connected = true
  handlers.get(event)?.forEach((handler) => handler(payload))
}

/** Responde al `subscribe:*` pendiente de ese evento, como haría el servidor con su acknowledgment. */
function answer(event: string, ack: unknown) {
  const index = pendingAcks.findIndex((entry) => entry.event === event)
  if (index < 0) throw new Error(`no hay acknowledgment pendiente para ${event}`)
  const [entry] = pendingAcks.splice(index, 1)
  entry.respond(ack)
}

function emittedOf(event: string): unknown[] {
  return emitted.filter(([name]) => name === event).map(([, payload]) => payload)
}

let socket: typeof import('./socket')
/** Token de sesión simulado: `null` equivale a no tener sesión. */
let currentToken: string | null = 'jwt-test'

beforeEach(async () => {
  vi.mocked(io).mockClear()
  mockSocket.on.mockClear()
  mockSocket.off.mockClear()
  mockSocket.emit.mockClear()
  mockSocket.connect.mockClear()
  mockSocket.disconnect.mockClear()
  handlers.clear()
  emitted.length = 0
  pendingAcks.length = 0
  mockSocket.connected = false
  currentToken = 'jwt-test'
  setAuthTokenProvider(() => currentToken)
  socket = await import('./socket')
  socket.resetSocketForTests()
})

afterEach(() => {
  socket.resetSocketForTests()
  setAuthTokenProvider(null)
  setAuthErrorHandler(null)
  vi.useRealTimers()
})

/** `auth` de `io(...)` es una función: socket.io la invoca en cada (re)conexión. */
function runHandshakeAuth(callback: (data: Record<string, unknown>) => void): void {
  const options = vi.mocked(io).mock.calls[0][1] as { auth: (cb: (data: Record<string, unknown>) => void) => void }
  options.auth(callback)
}

function handshakeAuth(): Record<string, unknown> {
  let data: Record<string, unknown> = {}
  runHandshakeAuth((next) => {
    data = next
  })
  return data
}

function handshakeError(code: string, retryable?: boolean) {
  return Object.assign(new Error(code), { data: retryable === undefined ? { code } : { code, message: 'no se usa', retryable } })
}

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

test('una reconexión vuelve a emitir subscribe para el mismo id', () => {
  const onUpdate = vi.fn()
  socket.subscribeProjectVersionUpdates('pv-9', onUpdate)
  trigger('connect')
  trigger('connect')
  expect(emittedOf('subscribe:project-version')).toHaveLength(2)
})

// --- Handshake (INTEROP-2.18 §6.6) -------------------------------------------------------------

test('sin sesión no se abre el socket: io no se llama y la suscripción es un no-op inocuo', () => {
  currentToken = null
  const onUpdate = vi.fn()
  const unsubscribe = socket.subscribeProjectVersionUpdates('pv-1', onUpdate)

  expect(vi.mocked(io)).not.toHaveBeenCalled()
  expect(mockSocket.on).not.toHaveBeenCalled()
  expect(() => unsubscribe()).not.toThrow()
  expect(emitted).toEqual([])
  expect(mockSocket.disconnect).not.toHaveBeenCalled()
})

test('sin sesión las suscripciones de analysis-run y experiment también son no-op', () => {
  currentToken = null
  const unsubscribeRun = socket.subscribeAnalysisRunUpdates('ar-1', vi.fn())
  const unsubscribeExperiment = socket.subscribeExperimentUpdates('exp-1', vi.fn())
  expect(vi.mocked(io)).not.toHaveBeenCalled()
  expect(() => {
    unsubscribeRun()
    unsubscribeExperiment()
  }).not.toThrow()
  expect(emitted).toEqual([])
})

test('HU62: el handshake envía el access token vigente en auth.token, leído en cada conexión', () => {
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  expect(handshakeAuth()).toEqual({ token: 'jwt-test' })
  currentToken = 'jwt-2'
  expect(handshakeAuth()).toEqual({ token: 'jwt-2' })
})

test('el token va solo en auth: io no recibe query ni el token en la URL', () => {
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  const [url, options] = vi.mocked(io).mock.calls[0] as [string, Record<string, unknown>]
  expect(options).not.toHaveProperty('query')
  expect(typeof options.auth).toBe('function')
  expect(url).not.toContain('jwt-test')
  expect(handshakeAuth()).toEqual({ token: 'jwt-test' })
})

test('si el token desaparece entre reconexiones no envía auth vacío (nunca {}) y no reconecta', () => {
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  currentToken = null
  const callback = vi.fn()
  runHandshakeAuth(callback)
  expect(callback).not.toHaveBeenCalled()
  expect(mockSocket.disconnect).toHaveBeenCalled()
  expect(mockSocket.connect).not.toHaveBeenCalled()
})

// --- connect_error -----------------------------------------------------------------------------

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

test('IDENTITY_UNAVAILABLE sin `retryable` en data se trata como reintentable por código', () => {
  vi.useFakeTimers()
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', handshakeError('IDENTITY_UNAVAILABLE'))
  vi.advanceTimersByTime(1_000)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)
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

test.each(['AUTH_REQUIRED', 'INVALID_ACCESS_TOKEN', 'GITHUB_IDENTITY_REQUIRED'])(
  'connect_error %s (no reintentable) cierra la sesión como HTTP: resetSocket + notifyAuthError, sin connect() ni bucle',
  (code) => {
    vi.useFakeTimers()
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    socket.subscribeProjectVersionUpdates('pv-1', vi.fn())

    trigger('connect_error', handshakeError(code, false))
    vi.advanceTimersByTime(120_000)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ status: 401, code })
    expect(mockSocket.connect).not.toHaveBeenCalled()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  },
)

test.each(['UNAUTHORIZED', 'FORBIDDEN', 'UN_CODIGO_FUTURO_DE_LA_APLICACION'])(
  'connect_error %s (genérico o desconocido, no reintentable) se tolera: no cierra sesión ni rompe el socket',
  (code) => {
    vi.useFakeTimers()
    const handler = vi.fn()
    setAuthErrorHandler(handler)
    const onUpdate = vi.fn()
    socket.subscribeProjectVersionUpdates('pv-1', onUpdate)

    trigger('connect_error', handshakeError(code, false))
    vi.advanceTimersByTime(120_000)

    expect(handler).not.toHaveBeenCalled()
    expect(mockSocket.connect).not.toHaveBeenCalled()
    expect(mockSocket.disconnect).not.toHaveBeenCalled()
    expect(vi.mocked(io)).toHaveBeenCalledTimes(1)
    trigger('connect')
    trigger('project-version:update', { id: 'pv-1', status: 'COMPLETED' })
    expect(onUpdate).toHaveBeenCalledWith({ id: 'pv-1', status: 'COMPLETED' })
  },
)

test('connect_error con código genérico y retryable true usa el backoff que indica el data', () => {
  vi.useFakeTimers()
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect_error', handshakeError('TOO_MANY_REQUESTS', true))
  vi.advanceTimersByTime(999)
  expect(mockSocket.connect).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(mockSocket.connect).toHaveBeenCalledTimes(1)
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
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  expect(handshakeAuth()).toEqual({ token: 'jwt-test' })
  expect(vi.mocked(io)).toHaveBeenCalledTimes(1)

  socket.resetSocket()
  expect(mockSocket.disconnect).toHaveBeenCalled()
  currentToken = 'jwt-B'
  socket.subscribeProjectVersionUpdates('pv-2', vi.fn())

  expect(vi.mocked(io)).toHaveBeenCalledTimes(2)
  expect(handshakeAuth()).toEqual({ token: 'jwt-B' })
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
  socket.subscribeProjectVersionUpdates('pv-1', vi.fn())
  trigger('connect')
  emitted.length = 0

  currentToken = 'jwt-2'
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

// --- subscribe / ack / unsubscribe / reconciliación ------------------------------------------

test('subscribe de analysis-run y experiment usa sus payloads y filtra sus update por id', () => {
  const onRun = vi.fn()
  const onExperiment = vi.fn()
  const unsubscribeRun = socket.subscribeAnalysisRunUpdates('ar-1', onRun)
  const unsubscribeExperiment = socket.subscribeExperimentUpdates('exp-1', onExperiment)

  trigger('connect')
  expect(emitted).toContainEqual(['subscribe:analysis-run', { analysisRunId: 'ar-1' }])
  expect(emitted).toContainEqual(['subscribe:experiment', { experimentId: 'exp-1' }])

  trigger('analysis-run:update', { id: 'ar-2', status: 'PROCESSING' })
  trigger('experiment:update', { id: 'exp-2', status: 'RUNNING' })
  expect(onRun).not.toHaveBeenCalled()
  expect(onExperiment).not.toHaveBeenCalled()

  trigger('analysis-run:update', { id: 'ar-1', status: 'ACTION_REQUIRED' })
  trigger('experiment:update', { id: 'exp-1', status: 'COMPLETED' })
  expect(onRun).toHaveBeenCalledWith({ id: 'ar-1', status: 'ACTION_REQUIRED' })
  expect(onExperiment).toHaveBeenCalledWith({ id: 'exp-1', status: 'COMPLETED' })

  unsubscribeRun()
  unsubscribeExperiment()
  expect(emitted).toContainEqual(['unsubscribe:analysis-run', { analysisRunId: 'ar-1' }])
  expect(emitted).toContainEqual(['unsubscribe:experiment', { experimentId: 'exp-1' }])
})

test('unsubscribe es idempotente y no emite si el socket ya no está conectado', () => {
  const unsubscribe = socket.subscribeAnalysisRunUpdates('ar-1', vi.fn())
  unsubscribe()
  unsubscribe()
  expect(emittedOf('unsubscribe:analysis-run')).toHaveLength(0)

  mockSocket.connected = false
  const again = socket.subscribeExperimentUpdates('exp-1', vi.fn())
  trigger('connect')
  mockSocket.connected = false
  again()
  expect(emittedOf('unsubscribe:experiment')).toHaveLength(0)
})

test('subscribed: true no cambia el estado ni reconcilia en la primera suscripción', () => {
  const onReconcile = vi.fn()
  socket.subscribeAnalysisRunUpdates('ar-1', vi.fn(), onReconcile)
  trigger('connect')
  answer('subscribe:analysis-run', { subscribed: true, code: null, retryable: false })
  expect(onReconcile).not.toHaveBeenCalled()
  expect(mockSocket.disconnect).not.toHaveBeenCalled()
})

test('denegado o inexistente (sin distinguirlos) no reintenta ni lanza error: HTTP queda como base', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  const onReconcile = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', onUpdate, onReconcile)
  trigger('connect')
  expect(() => answer('subscribe:experiment', { subscribed: false, code: null, retryable: false })).not.toThrow()

  vi.advanceTimersByTime(120_000)
  expect(emittedOf('subscribe:experiment')).toHaveLength(1)
  expect(onUpdate).not.toHaveBeenCalled()
  expect(onReconcile).not.toHaveBeenCalled()
})

test('GITHUB_VERIFICATION_UNAVAILABLE reintenta con backoff acotado y reconcilia al suscribirse', () => {
  vi.useFakeTimers()
  const onReconcile = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', vi.fn(), onReconcile)
  trigger('connect')
  const unavailable = { subscribed: false, code: 'GITHUB_VERIFICATION_UNAVAILABLE', retryable: true }

  answer('subscribe:experiment', unavailable)
  vi.advanceTimersByTime(999)
  expect(emittedOf('subscribe:experiment')).toHaveLength(1)
  vi.advanceTimersByTime(1)
  expect(emittedOf('subscribe:experiment')).toHaveLength(2)

  answer('subscribe:experiment', unavailable)
  vi.advanceTimersByTime(1_999)
  expect(emittedOf('subscribe:experiment')).toHaveLength(2)
  vi.advanceTimersByTime(1)
  expect(emittedOf('subscribe:experiment')).toHaveLength(3)

  answer('subscribe:experiment', { subscribed: true, code: null, retryable: false })
  expect(onReconcile).toHaveBeenCalledTimes(1)

  vi.advanceTimersByTime(120_000)
  expect(emittedOf('subscribe:experiment')).toHaveLength(3)
})

test('GITHUB_VERIFICATION_UNAVAILABLE se rinde tras el máximo de intentos sin error visible', () => {
  vi.useFakeTimers()
  const onReconcile = vi.fn()
  socket.subscribeAnalysisRunUpdates('ar-1', vi.fn(), onReconcile)
  trigger('connect')
  const unavailable = { subscribed: false, code: 'GITHUB_VERIFICATION_UNAVAILABLE', retryable: true }

  for (let round = 0; round < 6; round += 1) {
    answer('subscribe:analysis-run', unavailable)
    vi.advanceTimersByTime(30_000)
  }
  // Initial + 5 reintentos; el sexto acuse ya no programa nada.
  expect(emittedOf('subscribe:analysis-run')).toHaveLength(6)
  expect(onReconcile).not.toHaveBeenCalled()
  expect(mockSocket.disconnect).not.toHaveBeenCalled()
})

test('reconciliación: cada conexión posterior a la primera re-emite subscribe y llama a onReconcile', () => {
  const onReconcile = vi.fn()
  socket.subscribeAnalysisRunUpdates('ar-1', vi.fn(), onReconcile)
  trigger('connect')
  expect(onReconcile).not.toHaveBeenCalled()
  trigger('connect')
  trigger('connect')
  expect(onReconcile).toHaveBeenCalledTimes(2)
  expect(emittedOf('subscribe:analysis-run')).toHaveLength(3)
})

test('si el socket ya estaba conectado al suscribir, la siguiente conexión cuenta como reconexión', () => {
  const onReconcile = vi.fn()
  mockSocket.connected = true
  socket.subscribeExperimentUpdates('exp-1', vi.fn(), onReconcile)
  expect(emittedOf('subscribe:experiment')).toHaveLength(1)
  trigger('connect')
  expect(onReconcile).toHaveBeenCalledTimes(1)
})

test('sin replay: un update que llega sin suscripción activa no se reproduce al suscribirse después', () => {
  const onUpdate = vi.fn()
  trigger('connect')
  trigger('experiment:update', { id: 'exp-1', status: 'COMPLETED' })
  socket.subscribeExperimentUpdates('exp-1', onUpdate)
  expect(onUpdate).not.toHaveBeenCalled()
})

// --- throttle de progreso (1500 ms por experimento) -------------------------------------------

test('ráfaga de progreso: una entrega inmediata y, al cerrar la ventana de 1500 ms, la última', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', onUpdate)
  trigger('connect')

  for (let completed = 1; completed <= 5; completed += 1) {
    trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: completed })
  }
  expect(onUpdate).toHaveBeenCalledTimes(1)
  expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ completedRepetitions: 1 }))

  vi.advanceTimersByTime(1_499)
  expect(onUpdate).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(onUpdate).toHaveBeenCalledTimes(2)
  expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ completedRepetitions: 5 }))

  // La ventana siguiente solo entrega si hay un cambio nuevo.
  vi.advanceTimersByTime(10_000)
  expect(onUpdate).toHaveBeenCalledTimes(2)
})

test('un estado terminal entrega de inmediato y cancela el progreso pendiente', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', onUpdate)
  trigger('connect')

  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 1 })
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 2 })
  trigger('experiment:update', { id: 'exp-1', status: 'COMPLETED', completedRepetitions: 6 })
  expect(onUpdate).toHaveBeenCalledTimes(2)
  expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'COMPLETED' }))

  vi.advanceTimersByTime(10_000)
  expect(onUpdate).toHaveBeenCalledTimes(2)
})

test('un cambio de estado no espera a la ventana de progreso', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', onUpdate)
  trigger('connect')

  trigger('experiment:update', { id: 'exp-1', status: 'PENDING', completedRepetitions: 0 })
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 0 })
  expect(onUpdate).toHaveBeenCalledTimes(2)
  expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'RUNNING' }))
})

test('analysis-run:update no se limita: el ritmo de 1500 ms es de experimento (§6.6)', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  socket.subscribeAnalysisRunUpdates('ar-1', onUpdate)
  trigger('connect')
  trigger('analysis-run:update', { id: 'ar-1', status: 'PROCESSING' })
  trigger('analysis-run:update', { id: 'ar-1', status: 'PROCESSING', attemptCount: 2 })
  expect(onUpdate).toHaveBeenCalledTimes(2)
})

test('unsubscribe limpia el timer de throttle: el progreso pendiente no se entrega después', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  const unsubscribe = socket.subscribeExperimentUpdates('exp-1', onUpdate)
  trigger('connect')
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 1 })
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 2 })
  unsubscribe()
  vi.advanceTimersByTime(10_000)
  expect(onUpdate).toHaveBeenCalledTimes(1)
})

test('resetSocket limpia timers de throttle y de verificación pendientes', () => {
  vi.useFakeTimers()
  const onUpdate = vi.fn()
  socket.subscribeExperimentUpdates('exp-1', onUpdate)
  socket.subscribeAnalysisRunUpdates('ar-1', vi.fn())
  trigger('connect')
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 1 })
  trigger('experiment:update', { id: 'exp-1', status: 'RUNNING', completedRepetitions: 2 })
  answer('subscribe:analysis-run', { subscribed: false, code: 'GITHUB_VERIFICATION_UNAVAILABLE', retryable: true })

  socket.resetSocket()
  vi.advanceTimersByTime(120_000)
  expect(onUpdate).toHaveBeenCalledTimes(1)
  expect(emittedOf('subscribe:analysis-run')).toHaveLength(1)
  expect(mockSocket.connect).not.toHaveBeenCalled()
})

test('tras resetSocket una suscripción anterior ya no recibe actualizaciones ni reenvía subscribe', () => {
  const onUpdate = vi.fn()
  socket.subscribeAnalysisRunUpdates('ar-1', onUpdate)
  trigger('connect')
  socket.resetSocket()
  trigger('analysis-run:update', { id: 'ar-1', status: 'SUCCESS' })
  trigger('connect')
  expect(onUpdate).not.toHaveBeenCalled()
  expect(emittedOf('subscribe:analysis-run')).toHaveLength(1)
})
