import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useIdempotencyKeys } from './idempotency'

test('conserva la misma key para retries de transporte y crea una nueva tras limpiarla', () => {
  const { result } = renderHook(() => useIdempotencyKeys())

  const first = result.current.getOrCreate('target-1')
  const second = result.current.getOrCreate('target-1')
  expect(second).toBe(first)

  result.current.clear('target-1')
  const third = result.current.getOrCreate('target-1')
  expect(third).not.toBe(first)
})

test('acciones lógicas distintas obtienen keys independientes', () => {
  const { result } = renderHook(() => useIdempotencyKeys())

  const forTargetA = result.current.getOrCreate('target-a')
  const forTargetB = result.current.getOrCreate('target-b')
  expect(forTargetA).not.toBe(forTargetB)
})
