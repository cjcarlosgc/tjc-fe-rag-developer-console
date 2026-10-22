import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { subscribeExperimentUpdates } from '../api/socket'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import type { AuthSession } from '../auth/types'
import type { ExperimentStatusResponse } from '../contracts/generated/contract-types'
import { useExperimentRealtime } from './useExperimentRealtime'

vi.mock('../api/socket', () => ({ subscribeExperimentUpdates: vi.fn() }))

const session: AuthSession = {
  user: { id: 'user-1', email: 'reviewer@example.test' },
  accessToken: 'jwt-test',
  githubProviderToken: null,
}
const unsubscribe = vi.fn()
const update = { id: 'exp-1', status: 'COMPLETED' } as unknown as ExperimentStatusResponse
const getResult = { id: 'exp-1', status: 'RUNNING', source: 'GET' }

/** Sesión que el test puede cambiar entre renders, como hace `AuthProvider`. */
let currentSession: AuthSession | null = session

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

/** Renderiza el hook junto a una consulta con la misma clave que `ExperimentPage`. */
function renderRealtime(experimentId: string | null, refetchInterval: number | false = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const queryFn = vi.fn(async () => getResult)
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={authValue(currentSession)}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }
  const rendered = renderHook(
    ({ id }: { id: string | null }) => {
      useExperimentRealtime(id)
      return useQuery({ queryKey: ['experiments', id], queryFn, enabled: Boolean(id), refetchInterval })
    },
    { wrapper, initialProps: { id: experimentId } },
  )
  return { ...rendered, client, queryFn }
}

/** Callbacks que el hook pasó a `subscribeExperimentUpdates`: aviso y reconciliación. */
function subscriptionCallbacks() {
  const call = vi.mocked(subscribeExperimentUpdates).mock.calls[0]
  return { onUpdate: call[1], onReconcile: call[2] }
}

beforeEach(() => {
  currentSession = session
  unsubscribe.mockClear()
  vi.mocked(subscribeExperimentUpdates).mockReset()
  vi.mocked(subscribeExperimentUpdates).mockReturnValue(unsubscribe)
})

afterEach(() => {
  vi.useRealTimers()
  setDataSourceForTests(null)
})

test('en modo mock no se suscribe aunque haya sesión', () => {
  setDataSourceForTests('mock')
  renderRealtime('exp-1')
  expect(subscribeExperimentUpdates).not.toHaveBeenCalled()
})

test('sin sesión no se suscribe', () => {
  setDataSourceForTests('live')
  currentSession = null
  renderRealtime('exp-1')
  expect(subscribeExperimentUpdates).not.toHaveBeenCalled()
})

test('sin experimentId no se suscribe', () => {
  setDataSourceForTests('live')
  renderRealtime(null)
  expect(subscribeExperimentUpdates).not.toHaveBeenCalled()
})

test('en live con sesión se suscribe al experimento', () => {
  setDataSourceForTests('live')
  renderRealtime('exp-1')
  expect(subscribeExperimentUpdates).toHaveBeenCalledTimes(1)
  expect(subscribeExperimentUpdates).toHaveBeenCalledWith('exp-1', expect.any(Function), expect.any(Function))
})

test('un aviso invalida el GET del experimento y no escribe el DTO del aviso en la caché', async () => {
  setDataSourceForTests('live')
  const { queryFn, client } = renderRealtime('exp-1')
  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

  await act(async () => {
    subscriptionCallbacks().onUpdate(update)
  })

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2))
  expect(client.getQueryData(['experiments', 'exp-1'])).toEqual(getResult)
})

test('una reconciliación tras reconectar invalida el GET del experimento', async () => {
  setDataSourceForTests('live')
  const { queryFn } = renderRealtime('exp-1')
  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

  await act(async () => {
    subscriptionCallbacks().onReconcile?.()
  })

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2))
})

test('al desmontar libera la suscripción', () => {
  setDataSourceForTests('live')
  const { unmount } = renderRealtime('exp-1')
  expect(unsubscribe).not.toHaveBeenCalled()
  unmount()
  expect(unsubscribe).toHaveBeenCalledTimes(1)
})

test('al cerrar sesión libera la suscripción y no se vuelve a suscribir sin sesión', () => {
  setDataSourceForTests('live')
  const { rerender } = renderRealtime('exp-1')
  expect(subscribeExperimentUpdates).toHaveBeenCalledTimes(1)

  currentSession = null
  rerender({ id: 'exp-1' })

  expect(unsubscribe).toHaveBeenCalledTimes(1)
  expect(subscribeExperimentUpdates).toHaveBeenCalledTimes(1)
})

test('el polling de la consulta sigue activo: un aviso no lo detiene', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  setDataSourceForTests('live')
  const { queryFn } = renderRealtime('exp-1', 560)

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
