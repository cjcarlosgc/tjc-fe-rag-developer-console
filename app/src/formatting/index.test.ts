import { expect, test } from 'vitest'
import { formatDuration, formatPercent } from './index'

test('formatea duraciones en unidades legibles', () => {
  expect(formatDuration(800)).toBe('800 ms')
  expect(formatDuration(65_000)).toBe('1 min 5 s')
})

test('limita porcentajes al rango observable', () => {
  expect(formatPercent(1.4)).toBe('100%')
  expect(formatPercent(-1)).toBe('0%')
})
