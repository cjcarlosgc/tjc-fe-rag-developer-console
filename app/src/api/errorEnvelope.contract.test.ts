import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateContract } from '../contracts/contract-validator'
import { ApiError, apiRequest } from './client'
import upstreamExample from '../../../spec/contracts/schemas/examples/error-envelope.upstream.json'
import validationExample from '../../../spec/contracts/schemas/examples/error-envelope.validation.json'

/** Contrato del error envelope (INTEROP-2.17 §4): Console lo interpreta igual venga de Core, Sandbox o GitHub Integration. */
afterEach(() => vi.unstubAllGlobals())

describe('ApiError interpreta el ErrorEnvelope canónico', () => {
  it.each([
    ['sin retryable (Core/Sandbox)', validationExample, 400, undefined],
    ['con retryable (GitHub Integration)', upstreamExample, 503, true],
  ])('%s', async (_name, example, status, retryable) => {
    expect(validateContract('error-envelope.schema.json', null, example).errors).toEqual([])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(example), { status, headers: { 'Content-Type': 'application/json' } })),
    )

    const error = await apiRequest('/cualquier-ruta').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status, code: example.code, message: example.message, correlationId: example.correlationId })
    expect((error as ApiError).retryable).toBe(retryable)
  })
})
