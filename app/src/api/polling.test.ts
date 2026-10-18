import { describe, expect, it } from 'vitest'
import { DEFAULT_POLL_MS, MAX_POLL_MS, MIN_POLL_MS, TEST_POLL_MS, clampPollMs, pollDelayMs } from './polling'

describe('clampPollMs', () => {
  it.each([
    [1000, 1000],
    [10, MIN_POLL_MS],
    [10 ** 9, MAX_POLL_MS],
    [0, DEFAULT_POLL_MS],
    [-5, DEFAULT_POLL_MS],
    [Number.NaN, DEFAULT_POLL_MS],
    [null, DEFAULT_POLL_MS],
    [undefined, DEFAULT_POLL_MS],
  ])('%s → %s', (requested, expected) => {
    expect(clampPollMs(requested)).toBe(expected)
  })

  it('usa el valor de respaldo indicado cuando Core no informa pollAfterMs', () => {
    expect(clampPollMs(undefined, 560)).toBe(560)
  })
})

describe('pollDelayMs', () => {
  it('en modo test devuelve una espera corta fija, sin importar lo que pida Core', () => {
    expect(pollDelayMs(5000)).toBe(TEST_POLL_MS)
    expect(pollDelayMs(undefined, 560)).toBe(TEST_POLL_MS)
  })
})
