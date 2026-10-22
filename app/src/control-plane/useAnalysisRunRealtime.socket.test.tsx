import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { io } from 'socket.io-client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setAuthErrorHandler, setAuthTokenProvider } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import { useAnalysisRunRealtime } from './useAnalysisRunRealtime'

type Handler = (...args: unknown[]) => void

// Socket REAL de `api/socket`, con `socket.io-client` simulado (mismo patrón que `api/socket.test.ts`).
const handlers = new Map<string, Set<Handler>>()
const mockSocket = {
  connected: false,
  on: vi.fn((event: string, handler: Handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
  }),
  off: vi.fn((event: string, handler: Handler) => {
    handlers.get(event)?.delete(handler)
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

const authValue: AuthContextValue = {
  status: 'authenticated',
  session: { user: { id: 'user-1', email: 'reviewer@example.test' }, accessToken: 'jwt-test', githubProviderToken: null },
  signInWithGitHub: vi.fn(),
  oauthError: null,
  dismissOAuthError: vi.fn(),
  sessionNotice: null,
  dismissSessionNotice: vi.fn(),
  signOut: vi.fn(),
}

let socket: typeof import('../api/socket')

beforeEach(async () => {
  vi.mocked(io).mockClear()
  handlers.clear()
  mockSocket.connected = false
  setDataSourceForTests('live')
  setAuthTokenProvider(() => 'jwt-test')
  socket = await import('../api/socket')
  socket.resetSocketForTests()
})

afterEach(() => {
  socket.resetSocketForTests()
  setAuthTokenProvider(null)
  setAuthErrorHandler(null)
  setDataSourceForTests(null)
})

function listenerCount(event: string): number {
  return handlers.get(event)?.size ?? 0
}

test('tras desmontar el hook no quedan listeners de analysis-run:update ni de connect', () => {
  const client = new QueryClient()
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }
  const { unmount } = renderHook(() => useAnalysisRunRealtime('run-1'), { wrapper })
  expect(listenerCount('analysis-run:update')).toBe(1)
  expect(listenerCount('connect')).toBeGreaterThanOrEqual(1)
  const connectWhileMounted = listenerCount('connect')

  unmount()

  expect(listenerCount('analysis-run:update')).toBe(0)
  expect(listenerCount('connect')).toBe(connectWhileMounted - 1)
})
