import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { subscribeAnalysisRunUpdates } from '../api/socket'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import type { AuthSession } from '../auth/types'
import type { AnalysisRunDetailResponse } from '../contracts/generated/contract-types'
import { controlPlaneKeys } from './queries'
import { useAnalysisRunRealtime } from './useAnalysisRunRealtime'

vi.mock('../api/socket', () => ({ subscribeAnalysisRunUpdates: vi.fn() }))

const session: AuthSession = {
  user: { id: 'user-1', email: 'reviewer@example.test' },
  accessToken: 'jwt-test',
  githubProviderToken: null,
}
const unsubscribe = vi.fn()
const update = { id: 'run-1', status: 'SUCCESS' } as unknown as AnalysisRunDetailResponse
const getResult = { id: 'run-1', status: 'RUNNING', source: 'GET' }

let currentSession: AuthSession | null = session
let activeSubscriptions = 0

function authValue(next: AuthSession | null): AuthContextValue {
  return {
    status: next ? 'authenticated' : 'unauthenticated',
    session: next,
    signInWithGitHub: vi.fn(),
    oauthError: null,
    dismissOAuthError: vi.fn(),
    sessionNotice: null,
    dismissSessionNotice: vi.fn(),
    signOut: vi.fn(),
  }
}

function renderRealtime(analysisRunId: string | null, options: { refetchInterval?: number | false; strict?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const queryFn = vi.fn(async () => getResult)
  function wrapper({ children }: { children: ReactNode }) {
    const tree = (
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={authValue(currentSession)}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
    return options.strict ? <StrictMode>{tree}</StrictMode> : tree
  }
  const rendered = renderHook(
    ({ id }: { id: string | null }) => {
      useAnalysisRunRealtime(id)
      return useQuery({
        queryKey: controlPlaneKeys.run(id ?? ''),
        queryFn,
        enabled: Boolean(id),
        refetchInterval: options.refetchInterval ?? false,
      })
    },
    { wrapper, initialProps: { id: analysisRunId } },
  )
  return { ...rendered, client, queryFn }
}

function subscriptionCallbacks() {
  const call = vi.mocked(subscribeAnalysisRunUpdates).mock.calls[0]
  return { onUpdate: call[1], onReconcile: call[2] }
}

beforeEach(() => {
  currentSession = session
  activeSubscriptions = 0
  unsubscribe.mockClear()
  vi.mocked(subscribeAnalysisRunUpdates).mockReset()
  vi.mocked(subscribeAnalysisRunUpdates).mockReturnValue(unsubscribe)
})

afterEach(() => {
  vi.useRealTimers()
  setDataSourceForTests(null)
})

test('en modo mock no se suscribe aunque haya sesión', () => {
  setDataSourceForTests('mock')
  renderRealtime('run-1')
  expect(subscribeAnalysisRunUpdates).not.toHaveBeenCalled()
})

test('sin sesión no se suscribe', () => {
  setDataSourceForTests('live')
  currentSession = null
  renderRealtime('run-1')
  expect(subscribeAnalysisRunUpdates).not.toHaveBeenCalled()
})

test('sin analysisRunId no se suscribe', () => {
  setDataSourceForTests('live')
  renderRealtime(null)
  expect(subscribeAnalysisRunUpdates).not.toHaveBeenCalled()
})

test('en live con sesión se suscribe al Run', () => {
  setDataSourceForTests('live')
  renderRealtime('run-1')
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(1)
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledWith('run-1', expect.any(Function), expect.any(Function))
})

test('un aviso invalida el GET del Run y no escribe el DTO del aviso en la caché', async () => {
  setDataSourceForTests('live')
  const { queryFn, client } = renderRealtime('run-1')
  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

  await act(async () => {
    subscriptionCallbacks().onUpdate(update)
  })

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2))
  expect(client.getQueryData(controlPlaneKeys.run('run-1'))).toEqual(getResult)
})

test('una reconciliación tras reconectar invalida el GET del Run', async () => {
  setDataSourceForTests('live')
  const { queryFn } = renderRealtime('run-1')
  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

  await act(async () => {
    subscriptionCallbacks().onReconcile?.()
  })

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2))
})

test('al desmontar libera la suscripción una vez', () => {
  setDataSourceForTests('live')
  const { unmount } = renderRealtime('run-1')
  expect(unsubscribe).not.toHaveBeenCalled()
  unmount()
  expect(unsubscribe).toHaveBeenCalledTimes(1)
})

test('al cerrar sesión libera la suscripción y no se vuelve a suscribir sin sesión', () => {
  setDataSourceForTests('live')
  const { rerender } = renderRealtime('run-1')
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(1)

  currentSession = null
  rerender({ id: 'run-1' })

  expect(unsubscribe).toHaveBeenCalledTimes(1)
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(1)
})

test('al cambiar de analysisRunId libera la anterior y suscribe la nueva', () => {
  setDataSourceForTests('live')
  const { rerender } = renderRealtime('run-1')
  rerender({ id: 'run-2' })

  expect(unsubscribe).toHaveBeenCalledTimes(1)
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(2)
  expect(vi.mocked(subscribeAnalysisRunUpdates).mock.calls[1][0]).toBe('run-2')
})

test('en StrictMode (monta, desmonta, monta) queda exactamente una suscripción viva', () => {
  setDataSourceForTests('live')
  vi.mocked(subscribeAnalysisRunUpdates).mockImplementation(() => {
    activeSubscriptions += 1
    let released = false
    return () => {
      if (released) return
      released = true
      activeSubscriptions -= 1
    }
  })
  const { unmount } = renderRealtime('run-1', { strict: true })
  expect(activeSubscriptions).toBe(1)
  unmount()
  expect(activeSubscriptions).toBe(0)
})

test('el refetchInterval de una consulta sigue funcionando con reloj falso', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  setDataSourceForTests('live')
  const { queryFn } = renderRealtime('run-1', { refetchInterval: 560 })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(560 * 3)
  })
  const beforeUpdate = queryFn.mock.calls.length
  expect(beforeUpdate).toBeGreaterThanOrEqual(3)

  await act(async () => {
    subscriptionCallbacks().onUpdate(update)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(560 * 3)
  })
  expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(beforeUpdate + 3)
})

test('un aviso invalida exactamente la clave del Run y ninguna otra (propuestas, traza)', async () => {
  setDataSourceForTests('live')
  const { client } = renderRealtime('run-1')
  const spy = vi.spyOn(client, 'invalidateQueries')
  await act(async () => {
    subscriptionCallbacks().onUpdate(update)
  })
  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy).toHaveBeenCalledWith({ queryKey: controlPlaneKeys.run('run-1') })
})
