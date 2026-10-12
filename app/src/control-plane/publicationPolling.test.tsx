import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { mockCreateTestPublication, mockListTestProposals, resetMockBackend } from '../api/mockBackend'
import { ApiError } from '../api/client'
import { createTestPublication, getTestPublication, listTestProposals } from './api'
import {
  controlPlaneKeys,
  isInProgressPublicationStatus,
  isTerminalPublicationStatus,
  publicationPollIntervalMs,
  useRefreshOnPublicationTerminal,
  usePublication,
} from './queries'
import type { TestPublicationResponse } from './types'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('estados de publicación', () => {
  it('clasifica terminales (PUBLISHED, FAILED, STALE, CLOSED) y en curso (PENDING, PUBLISHING)', () => {
    for (const status of ['PUBLISHED', 'FAILED', 'STALE', 'CLOSED'] as const) {
      expect(isTerminalPublicationStatus(status)).toBe(true)
      expect(isInProgressPublicationStatus(status)).toBe(false)
    }
    for (const status of ['PENDING', 'PUBLISHING'] as const) {
      expect(isTerminalPublicationStatus(status)).toBe(false)
      expect(isInProgressPublicationStatus(status)).toBe(true)
    }
    expect(isTerminalPublicationStatus(undefined)).toBe(false)
    expect(isInProgressPublicationStatus(null)).toBe(false)
  })
})

describe('publicationPollIntervalMs', () => {
  it('no sondea en estado terminal ni tras un error', () => {
    expect(publicationPollIntervalMs({ status: 'PUBLISHED', hasError: false, pollAfterMs: 300 }, false)).toBe(false)
    expect(publicationPollIntervalMs({ status: 'FAILED', hasError: false }, false)).toBe(false)
    expect(publicationPollIntervalMs({ status: 'STALE', hasError: false }, false)).toBe(false)
    expect(publicationPollIntervalMs({ status: 'CLOSED', hasError: false }, false)).toBe(false)
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: true, pollAfterMs: 300 }, false)).toBe(false)
  })

  it('usa pollAfterMs del 202 cuando es un número positivo', () => {
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: false, pollAfterMs: 750 }, false)).toBe(750)
    expect(publicationPollIntervalMs({ status: 'PUBLISHING', hasError: false, pollAfterMs: 300 }, false)).toBe(300)
  })

  it('cae al fallback de 2000 ms sin pollAfterMs válido', () => {
    expect(publicationPollIntervalMs({ hasError: false }, false)).toBe(2000)
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: false, pollAfterMs: 0 }, false)).toBe(2000)
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: false, pollAfterMs: -5 }, false)).toBe(2000)
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: false, pollAfterMs: null }, false)).toBe(2000)
  })

  it('en modo test usa intervalo corto', () => {
    expect(publicationPollIntervalMs({ status: 'PENDING', hasError: false, pollAfterMs: 5000 }, true)).toBe(10)
  })
})

describe('transiciones del mock de publicación', () => {
  it('PENDING → PUBLISHING → PUBLISHED con branch, companion PR y propuestas PUBLISHED solo al terminal', async () => {
    const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1', 'prop_pr45_2', 'prop_pr45_3'] })
    expect(accepted).toMatchObject({ status: 'PENDING', pollAfterMs: expect.any(Number) })
    expect(accepted.pollAfterMs).toBeGreaterThan(0)

    const first = await getTestPublication(accepted.publicationId)
    expect(first.status).toBe('PUBLISHING')
    expect((await listTestProposals('arun_checkout_pr45')).items.every((item) => item.status === 'AVAILABLE')).toBe(true)

    const terminal = await getTestPublication(accepted.publicationId)
    expect(terminal).toMatchObject({
      status: 'PUBLISHED',
      branchName: 'rag-tests/pr-45-e5e5e5e',
      failureMessage: null,
    })
    expect(terminal.companionPullRequestNumber).toEqual(expect.any(Number))
    expect(terminal.companionPullRequestUrl).toMatch(/^https:\/\//)
    expect((await listTestProposals('arun_checkout_pr45')).items.every((item) => item.status === 'PUBLISHED')).toBe(true)

    // Terminal estable: lecturas posteriores no cambian el estado.
    expect((await getTestPublication(accepted.publicationId)).status).toBe('PUBLISHED')
  })

  it('escenario FAILED determinista con failureMessage rotulado y propuestas sin publicar', async () => {
    const accepted = await mockCreateTestPublication('arun_checkout_pr49', { proposalIds: ['prop_pr49_1'] })
    await getTestPublication(accepted.publicationId)
    const failed = await getTestPublication(accepted.publicationId)
    expect(failed.status).toBe('FAILED')
    expect(failed.failureMessage).toContain('DEMO · DATOS SIMULADOS')
    expect((await mockListTestProposals('arun_checkout_pr49')).items.find((item) => item.id === 'prop_pr49_1')?.status).toBe('AVAILABLE')
  })

  it('escenario STALE determinista con failureMessage rotulado', async () => {
    const accepted = await mockCreateTestPublication('arun_billing_pr17_2', { proposalIds: ['prop_pr17_2_1'] })
    await getTestPublication(accepted.publicationId)
    const stale = await getTestPublication(accepted.publicationId)
    expect(stale.status).toBe('STALE')
    expect(stale.failureMessage).toContain('DEMO · DATOS SIMULADOS')
  })

  it('errores de dominio alineados con el contrato: 422 para propuesta no disponible', async () => {
    const accepted = await mockCreateTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    await getTestPublication(accepted.publicationId)
    await getTestPublication(accepted.publicationId) // terminal PUBLISHED: la propuesta ya no está AVAILABLE
    const error = await createTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, code: 'TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE' })
  })

  it('errores de dominio alineados con el contrato: 409 para Run no SUCCESS', async () => {
    const error = await createTestPublication('arun_checkout_pr46', { proposalIds: ['prop_pr46_1'] }).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 409, code: 'TEST_PUBLICATION_INVALID_RUN_STATUS' })
  })
})

describe('usePublication y refresco al terminal', () => {
  it('sondea hasta PUBLISHED y deja de sondear en terminal', async () => {
    const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    const client = newClient()
    const { result } = renderHook(() => usePublication(accepted.publicationId, accepted.pollAfterMs), { wrapper: wrapperFor(client) })

    await waitFor(() => expect(result.current.data?.status).toBe('PUBLISHED'))
    const observed: TestPublicationResponse['status'] | undefined = result.current.data?.status
    expect(isTerminalPublicationStatus(observed)).toBe(true)
    client.clear()
  })

  it('no consulta si no hay publicationId', () => {
    const client = newClient()
    const spy = vi.spyOn(client, 'fetchQuery')
    const { result } = renderHook(() => usePublication(null, 300), { wrapper: wrapperFor(client) })
    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
    client.clear()
  })

  it('invalida propuestas y Run una sola vez al llegar a terminal', async () => {
    const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    const client = newClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(
      () => {
        const publication = usePublication(accepted.publicationId, accepted.pollAfterMs)
        useRefreshOnPublicationTerminal('arun_checkout_pr45', publication.data)
        return publication
      },
      { wrapper: wrapperFor(client) },
    )

    await waitFor(() => expect(result.current.data?.status).toBe('PUBLISHED'))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: controlPlaneKeys.proposals('arun_checkout_pr45') }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: controlPlaneKeys.run('arun_checkout_pr45') })
    // Re-renders y lecturas terminales adicionales no repiten la invalidación.
    expect(invalidate.mock.calls.filter(([arg]) => JSON.stringify(arg) === JSON.stringify({ queryKey: controlPlaneKeys.proposals('arun_checkout_pr45') }))).toHaveLength(1)
    client.clear()
  })

  it('no invalida mientras la publicación está en curso', async () => {
    const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: ['prop_pr45_1'] })
    const client = newClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    renderHook(() => useRefreshOnPublicationTerminal('arun_checkout_pr45', { id: accepted.publicationId, status: 'PUBLISHING' } as TestPublicationResponse), { wrapper: wrapperFor(client) })
    expect(invalidate).not.toHaveBeenCalled()
    client.clear()
  })
})
