import { afterEach, describe, expect, it, vi } from 'vitest'
import { canAnimateCanvas } from './canAnimateCanvas'

// WI-CONSOLE-047, corte D. Sin reloj real: canAnimateCanvas no usa temporizadores.
// `matchMedia` se simula; jsdom no lo implementa.

const QUERY = '(prefers-reduced-motion: reduce)'

function stubMatchMedia(matches: boolean) {
  const matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia })
  return matchMedia
}

function removeMatchMedia() {
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: undefined })
}

afterEach(() => {
  vi.unstubAllEnvs()
  delete (window as unknown as { matchMedia?: unknown }).matchMedia
})

describe('canAnimateCanvas', () => {
  it('en modo test (MODE=test, el de Vitest) devuelve false aunque no haya reduce', () => {
    expect(import.meta.env.MODE).toBe('test')
    stubMatchMedia(false)
    expect(canAnimateCanvas()).toBe(false)
  })

  it('fuera de test y con prefers-reduced-motion: reduce devuelve false y consulta la media exacta', () => {
    vi.stubEnv('MODE', 'development')
    const matchMedia = stubMatchMedia(true)
    expect(canAnimateCanvas()).toBe(false)
    expect(matchMedia).toHaveBeenCalledWith(QUERY)
  })

  it('fuera de test y sin reduce devuelve true', () => {
    vi.stubEnv('MODE', 'development')
    stubMatchMedia(false)
    expect(canAnimateCanvas()).toBe(true)
  })

  it('fuera de test y sin soporte de matchMedia devuelve true (no hay preferencia que respetar)', () => {
    vi.stubEnv('MODE', 'development')
    removeMatchMedia()
    expect(canAnimateCanvas()).toBe(true)
  })
})
