import { afterEach, beforeEach, expect, test, vi } from 'vitest'

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
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

function trigger(event: string, payload?: unknown) {
  if (event === 'connect') mockSocket.connected = true
  handlers.get(event)?.forEach((handler) => handler(payload))
}

let socket: typeof import('./socket')

beforeEach(async () => {
  handlers.clear()
  emitted.length = 0
  mockSocket.connected = false
  socket = await import('./socket')
  socket.resetSocketForTests()
})

afterEach(() => {
  socket.resetSocketForTests()
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
