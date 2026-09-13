import { describe, expect, it } from 'vitest'
import { formatRelativeAge } from './relativeTime'

describe('formatRelativeAge', () => {
  const now = new Date('2026-09-13T12:00:00.000Z').getTime()

  it('menos de un minuto', () => {
    expect(formatRelativeAge('2026-09-13T11:59:45.000Z', now)).toBe('justo ahora')
  })

  it('minutos', () => {
    expect(formatRelativeAge('2026-09-13T11:52:00.000Z', now)).toBe('hace 8 min')
  })

  it('horas', () => {
    expect(formatRelativeAge('2026-09-13T09:00:00.000Z', now)).toBe('hace 3 h')
  })

  it('días', () => {
    expect(formatRelativeAge('2026-09-10T12:00:00.000Z', now)).toBe('hace 3 d')
  })

  it('nunca devuelve una edad negativa para timestamps futuros por deriva de reloj', () => {
    expect(formatRelativeAge('2026-09-13T12:05:00.000Z', now)).toBe('justo ahora')
  })
})
