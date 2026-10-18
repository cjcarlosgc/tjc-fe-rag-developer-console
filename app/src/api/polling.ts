/**
 * Espera entre sondeos de operaciones asíncronas (spec async-state). Respeta el `pollAfterMs` que informa Core en el
 * `202`, lo acota para que un valor absurdo no sature ni detenga el sondeo y concentra en un único lugar el modo
 * acelerado de las pruebas.
 */
export const MIN_POLL_MS = 250
export const MAX_POLL_MS = 30_000
export const DEFAULT_POLL_MS = 900
/** Espera en `MODE === 'test'`: las pruebas no deben depender de relojes reales. */
export const TEST_POLL_MS = 10

export function pollDelayMs(requestedMs?: number | null, fallbackMs: number = DEFAULT_POLL_MS): number {
  if (import.meta.env.MODE === 'test') return TEST_POLL_MS
  const base = typeof requestedMs === 'number' && Number.isFinite(requestedMs) && requestedMs > 0 ? requestedMs : fallbackMs
  return Math.min(Math.max(base, MIN_POLL_MS), MAX_POLL_MS)
}

/** Igual que `pollDelayMs` pero sin el atajo de pruebas; permite probar el acotado real. */
export function clampPollMs(requestedMs: number | null | undefined, fallbackMs: number = DEFAULT_POLL_MS): number {
  const base = typeof requestedMs === 'number' && Number.isFinite(requestedMs) && requestedMs > 0 ? requestedMs : fallbackMs
  return Math.min(Math.max(base, MIN_POLL_MS), MAX_POLL_MS)
}
