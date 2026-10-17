/**
 * INTEROP-2.7 §6.5.1 (CS-CORE-20261009-010): `failureCode` es cadena abierta. Solo estos dos valores tienen copy propio;
 * cualquier otro se tolera y se muestra con un mensaje genérico que incluye el código. Sin botón de reanudar: el contrato no define la ruta.
 */
const knownFailureMessages: Record<string, string> = {
  EXPERIMENT_FAILED: 'El experimento falló durante la ejecución.',
  // CS-CORE-20261009-010 no define ninguna ruta de reanudación (INTEROP §6.5.1): el texto no promete reanudar.
  // La UI no ofrece botón de reanudar ni vuelve a sondear un FAILED; el usuario crea un experimento nuevo.
  EXPERIMENT_WORKER_LOST: 'El experimento se interrumpió; vuelve a crearlo.',
}

export function experimentFailureTitle(): string {
  return 'El experimento no se completó'
}

export function experimentFailureMessage(code: string | null): string {
  if (code && knownFailureMessages[code]) return knownFailureMessages[code]
  if (code) return `El experimento terminó con un error no reconocido (código ${code}).`
  return 'El experimento terminó con un error.'
}
