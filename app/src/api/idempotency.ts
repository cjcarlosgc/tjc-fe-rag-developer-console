import { useCallback, useRef } from 'react'

/** Una key por confirmación explícita del usuario (p. ej. enviar una generación nueva). */
export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * Lifecycle reutilizable de `Idempotency-Key`: una key se crea al confirmar una acción
 * lógica y se conserva mientras esa acción siga en curso o haya fallado (para que un
 * reintento de transporte no duplique el efecto en Core). Solo se limpia al confirmar
 * éxito o al iniciar una acción distinta identificada por otra `id`.
 */
export function useIdempotencyKeys() {
  const keys = useRef(new Map<string, string>())

  const getOrCreate = useCallback((id: string) => {
    let key = keys.current.get(id)
    if (!key) {
      key = crypto.randomUUID()
      keys.current.set(id, key)
    }
    return key
  }, [])

  const clear = useCallback((id: string) => {
    keys.current.delete(id)
  }, [])

  return { getOrCreate, clear }
}
