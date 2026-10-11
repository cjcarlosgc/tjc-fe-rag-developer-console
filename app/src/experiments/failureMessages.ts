/**
 * INTEROP-2.7 §6.5.1 (CS-CORE-20261009-010): `failureCode` es cadena abierta. Solo estos dos valores tienen copy propio;
 * cualquier otro se tolera y se muestra con un mensaje genérico que incluye el código. Sin botón de reanudar: el contrato no define la ruta.
 */
const knownFailureMessages: Record<string, string> = {
  EXPERIMENT_FAILED: 'El experimento falló durante la ejecución.',
  // CS-CORE-20261009-010 dice que el run puede reanudarse, pero §6.5.1 no define ninguna ruta de reanudación:
  // el texto es solo informativo y la UI no ofrece botón de reanudar ni vuelve a sondear un FAILED.
  EXPERIMENT_WORKER_LOST: 'Se interrumpió el procesamiento y puede reanudarse.',
}

export function experimentFailureTitle(): string {
  return 'El experimento no se completó'
}

export function experimentFailureMessage(code: string | null): string {
  if (code && knownFailureMessages[code]) return knownFailureMessages[code]
  if (code) return `El experimento terminó con un error no reconocido (código ${code}).`
  return 'El experimento terminó con un error.'
}
