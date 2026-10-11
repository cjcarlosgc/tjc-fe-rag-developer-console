/**
 * INTEROP-2.7 §6.15 (WI-CONSOLE-014): `failureCode` es un string abierto. Core emite hoy tres valores documentados;
 * cualquier otro se tolera y se muestra con su código, sin inventar una causa.
 */
const KNOWN_FAILURE_MESSAGES: Record<string, string> = {
  RETRIEVAL_TARGET_UNRESOLVABLE: 'No se pudo resolver el símbolo elegido en la versión del proyecto de este Run.',
  RETRIEVAL_COMPARISON_FAILED: 'La comparación de retrieval falló y no produjo resultados.',
  RETRIEVAL_COMPARISON_WORKER_LOST: 'Se interrumpió el procesamiento de la comparación antes de terminar.',
}

/** Mensaje legible para un `failureCode` del estado; `null` código → «sin código». Nunca muestra trazas: `failureMessage` va aparte. */
export function retrievalFailureText(failureCode: string | null): string {
  if (!failureCode) return 'La comparación terminó con un error sin código.'
  const known = KNOWN_FAILURE_MESSAGES[failureCode]
  return known ?? `La comparación terminó con un error no reconocido (código ${failureCode}).`
}
