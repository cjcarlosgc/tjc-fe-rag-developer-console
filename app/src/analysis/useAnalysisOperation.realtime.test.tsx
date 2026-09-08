import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
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

let useAnalysisOperation: typeof import('./useAnalysisOperation').useAnalysisOperation
let resetSocketForTests: typeof import('../api/socket').resetSocketForTests

beforeEach(async () => {
  handlers.clear()
  emitted.length = 0
  mockSocket.connected = false
  setDataSourceForTests('live')
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'pv-1', status: 'ANALYZING' }), { status: 200 }))
  ;({ useAnalysisOperation } = await import('./useAnalysisOperation'))
  ;({ resetSocketForTests } = await import('../api/socket'))
  resetSocketForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
  setDataSourceForTests(null)
  resetSocketForTests()
})

test('HU21: se suscribe por WebSocket al ProjectVersion en curso', async () => {
  const client = new QueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  const { result } = renderHook(() => useAnalysisOperation('pv-1', 5_000), { wrapper: Wrapper })

  await waitFor(() => expect(result.current.data).toBeDefined())
  trigger('connect')

  expect(emitted).toContainEqual(['subscribe:project-version', { projectVersionId: 'pv-1' }])
})
