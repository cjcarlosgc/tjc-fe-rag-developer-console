import { expect, test } from 'vitest'
import { nextPollInterval } from './useAnalysisOperation'

test('respeta pollAfterMs entregado por Core', () => {
  expect(nextPollInterval({ status: 'ANALYZING' }, 2_400)).toBe(2_400)
})

test.each(['COMPLETED', 'FAILED'])('detiene polling en estado terminal %s', (status) => {
  expect(nextPollInterval({ status }, 1_000)).toBe(false)
})
