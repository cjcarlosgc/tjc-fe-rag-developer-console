import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'

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

let useRealtimeRun: typeof import('./useRealtimeRun').useRealtimeRun
let resetSocketForTests: typeof import('../api/socket').resetSocketForTests

beforeEach(async () => {
  handlers.clear()
  emitted.length = 0
  mockSocket.connected = false
  setDataSourceForTests('live')
  ;({ useRealtimeRun } = await import('./useRealtimeRun'))
  ;({ resetSocketForTests } = await import('../api/socket'))
  resetSocketForTests()
})

afterEach(() => {
  setDataSourceForTests(null)
  resetSocketForTests()
})

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

test('HU22: invalida la query del run cuando llega un update por WebSocket', () => {
  const client = new QueryClient()
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  renderHook(() => useRealtimeRun('run-1', 'GENERATING'), { wrapper: wrapperFor(client) })

  trigger('connect')
  trigger('test-run:update', { id: 'run-1', status: 'VALIDATING' })

  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['runs', 'run-1'] })
})

test('el modo mock no abre conexión WebSocket', () => {
  setDataSourceForTests('mock')
  const client = new QueryClient()
  renderHook(() => useRealtimeRun('run-1', 'GENERATING'), { wrapper: wrapperFor(client) })

  trigger('connect')
  expect(emitted).toHaveLength(0)
})

test('un run ya terminal no se suscribe', () => {
  const client = new QueryClient()
  renderHook(() => useRealtimeRun('run-1', 'COMPLETED'), { wrapper: wrapperFor(client) })

  trigger('connect')
  expect(emitted).toHaveLength(0)
})
