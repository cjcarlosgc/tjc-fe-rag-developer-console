import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { subscribeAnalysisRunUpdates } from '../api/socket'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import type { AuthSession } from '../auth/types'
import { getAnalysisRun } from './api'
import { analysisRunPollIntervalMs, controlPlaneKeys, isInProgressAnalysisRunStatus, useAnalysisRun } from './queries'
import { useAnalysisRunRealtime } from './useAnalysisRunRealtime'
import type { AnalysisRunDetailResponse, AnalysisRunStatus } from './types'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  getAnalysisRun: vi.fn(),
}))
vi.mock('../api/socket', () => ({ subscribeAnalysisRunUpdates: vi.fn() }))

const session: AuthSession = {
  user: { id: 'user-1', email: 'reviewer@example.test' },
  accessToken: 'jwt-test',
  githubProviderToken: null,
}

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

function runWithStatus(id: string, status: AnalysisRunStatus): AnalysisRunDetailResponse {
  return { id, status } as unknown as AnalysisRunDetailResponse
}

/** Estado simulado del GET del Run: lo que devuelve cada llamada, que el test puede cambiar entre sondeos. */
let runStatus: AnalysisRunStatus = 'PROCESSING'
let runError: Error | null = null

function callsFor(id: string): number {
  return vi.mocked(getAnalysisRun).mock.calls.filter(([arg]) => arg === id).length
}

/** Deja correr las promesas pendientes (la primera lectura de react-query) sin avanzar el reloj. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 3; i += 1) await vi.advanceTimersByTimeAsync(0)
  })
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

function renderRun(
  analysisRunId: string | null,
  options: { pollWhileInProgress?: boolean; pollAfterMs?: number | null } = { pollWhileInProgress: true },
  realtime = false,
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={authValue(session)}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }
  const rendered = renderHook(
    ({ id }: { id: string | null }) => {
      if (realtime) useAnalysisRunRealtime(id)
      return useAnalysisRun(id ?? '', options)
    },
    { wrapper, initialProps: { id: analysisRunId } },
  )
  return { ...rendered, client }
}

beforeEach(() => {
  // setImmediate queda sin falsear: el planificador de React lo usa para pintar tras cada sondeo.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  vi.stubEnv('MODE', 'development')
  setDataSourceForTests('live')
  runStatus = 'PROCESSING'
  runError = null
  vi.mocked(getAnalysisRun).mockReset()
  vi.mocked(getAnalysisRun).mockImplementation(async (id: string) => {
    if (runError) throw runError
    return runWithStatus(id, runStatus)
  })
  vi.mocked(subscribeAnalysisRunUpdates).mockReset()
  vi.mocked(subscribeAnalysisRunUpdates).mockReturnValue(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  setDataSourceForTests(null)
})

describe('isInProgressAnalysisRunStatus', () => {
  it('solo QUEUED y PROCESSING están en curso', () => {
    expect(isInProgressAnalysisRunStatus('QUEUED')).toBe(true)
    expect(isInProgressAnalysisRunStatus('PROCESSING')).toBe(true)
    for (const status of ['ACTION_REQUIRED', 'SUCCESS', 'BEHAVIORAL_MISMATCH', 'OBSOLETE'] as const) {
      expect(isInProgressAnalysisRunStatus(status)).toBe(false)
    }
    expect(isInProgressAnalysisRunStatus(undefined)).toBe(false)
    expect(isInProgressAnalysisRunStatus(null)).toBe(false)
  })
})

describe('analysisRunPollIntervalMs (sin modo test)', () => {
  it('acota pollAfterMs a 250 ms–30 s y usa 900 ms por defecto', () => {
    const inProgress = { status: 'PROCESSING' as const, hasError: false }
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: 5000 }, false)).toBe(5000)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: 100 }, false)).toBe(250)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: 999999 }, false)).toBe(30000)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: undefined }, false)).toBe(900)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: null }, false)).toBe(900)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: 0 }, false)).toBe(900)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: Number.NaN }, false)).toBe(900)
    expect(analysisRunPollIntervalMs({ ...inProgress, pollAfterMs: -1 }, false)).toBe(900)
  })

  it('no sondea tras error', () => {
    expect(analysisRunPollIntervalMs({ status: 'PROCESSING', hasError: true, pollAfterMs: 5000 }, false)).toBe(false)
  })

  it('no sondea sin datos ni en estados que no están en curso', () => {
    for (const status of ['ACTION_REQUIRED', 'SUCCESS', 'OBSOLETE'] as const) {
      expect(analysisRunPollIntervalMs({ status, hasError: false }, false)).toBe(false)
    }
    expect(analysisRunPollIntervalMs({ hasError: false }, false)).toBe(false)
    expect(analysisRunPollIntervalMs({ status: null, hasError: false }, false)).toBe(false)
  })
})

describe('analysisRunPollIntervalMs (modo test)', () => {
  it('usa TEST_POLL_MS en curso y no sondea en terminal', () => {
    expect(analysisRunPollIntervalMs({ status: 'QUEUED', hasError: false, pollAfterMs: 5000 }, true)).toBe(10)
    expect(analysisRunPollIntervalMs({ status: 'SUCCESS', hasError: false }, true)).toBe(false)
  })
})

describe('useAnalysisRun con pollWhileInProgress', () => {
  it('con un Run en PROCESSING sigue refetcheando cada intervalo por defecto (900 ms)', async () => {
    renderRun('run-1')
    await flush()
    expect(callsFor('run-1')).toBe(1)

    await advance(900)
    expect(callsFor('run-1')).toBe(2)
    await advance(900)
    expect(callsFor('run-1')).toBe(3)
  })

  it('se detiene al pasar a SUCCESS', async () => {
    const { client } = renderRun('run-1')
    await flush()
    expect(callsFor('run-1')).toBe(1)

    runStatus = 'SUCCESS'
    await advance(900)
    await flush()
    expect(client.getQueryData<AnalysisRunDetailResponse>(controlPlaneKeys.run('run-1'))?.status).toBe('SUCCESS')
    expect(callsFor('run-1')).toBe(2)

    await advance(60_000)
    expect(callsFor('run-1')).toBe(2)
  })

  it('deja de sondear tras un error', async () => {
    const { client } = renderRun('run-1')
    await flush()
    expect(callsFor('run-1')).toBe(1)

    runError = new Error('backend caído')
    await advance(900)
    await flush()
    expect(client.getQueryState(controlPlaneKeys.run('run-1'))?.status).toBe('error')
    const afterError = callsFor('run-1')

    await advance(60_000)
    expect(callsFor('run-1')).toBe(afterError)
  })

  it('sin la opción no hay polling', async () => {
    renderRun('run-1', {})
    await flush()
    await advance(60_000)
    expect(callsFor('run-1')).toBe(1)
  })

  it('con la opción explícita en false no hay polling', async () => {
    renderRun('run-1', { pollWhileInProgress: false })
    await flush()
    await advance(60_000)
    expect(callsFor('run-1')).toBe(1)
  })

  it('respeta pollAfterMs del 202 acotado a 250 ms–30 s', async () => {
    renderRun('run-1', { pollWhileInProgress: true, pollAfterMs: 5000 })
    await flush()
    await advance(4999)
    expect(callsFor('run-1')).toBe(1)
    await advance(1)
    expect(callsFor('run-1')).toBe(2)
  })

  it('pollAfterMs por debajo del mínimo se acota a 250 ms', async () => {
    renderRun('run-1', { pollWhileInProgress: true, pollAfterMs: 100 })
    await flush()
    await advance(249)
    expect(callsFor('run-1')).toBe(1)
    await advance(1)
    expect(callsFor('run-1')).toBe(2)
  })

  it('al desmontar no vuelve a pedir el Run', async () => {
    const { unmount } = renderRun('run-1')
    await flush()
    unmount()
    const atUnmount = callsFor('run-1')
    await advance(60_000)
    expect(callsFor('run-1')).toBe(atUnmount)
  })

  it('al cambiar de analysisRunId no sondea el anterior', async () => {
    const { rerender } = renderRun('run-a')
    await flush()
    rerender({ id: 'run-b' })
    await flush()
    const runACalls = callsFor('run-a')

    await advance(900 * 3)
    expect(callsFor('run-a')).toBe(runACalls)
    expect(callsFor('run-b')).toBeGreaterThanOrEqual(3)
  })

  it('convive con el tiempo real: un aviso invalida el GET sin romper el intervalo ni duplicar lecturas', async () => {
    const { client } = renderRun('run-1', { pollWhileInProgress: true }, true)
    await flush()
    expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(1)
    expect(callsFor('run-1')).toBe(1)

    // Un aviso del socket invalida la consulta del Run una vez: exactamente una lectura extra.
    const onUpdate = vi.mocked(subscribeAnalysisRunUpdates).mock.calls[0][1]
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await act(async () => {
      onUpdate({} as AnalysisRunDetailResponse)
    })
    await flush()
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: controlPlaneKeys.run('run-1') })
    expect(callsFor('run-1')).toBe(2)

    // El intervalo sigue activo tras el aviso: una lectura por intervalo, sin ráfagas.
    await advance(900)
    expect(callsFor('run-1')).toBe(3)
    await advance(900)
    expect(callsFor('run-1')).toBe(4)
  })
})
