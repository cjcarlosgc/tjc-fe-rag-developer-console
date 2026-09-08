import { ApiError } from '../api/client'

const messages: Record<string, string> = {
  TEST_RUN_NOT_FINISHED: 'El run todavía no terminó; espera a que llegue a un estado terminal para reintentar.',
  TARGET_RETRY_NOT_ALLOWED: 'Este target no admite reintento: solo se puede reintentar un target inválido o fallido.',
  IDEMPOTENCY_KEY_REQUIRED: 'No se pudo generar la clave de idempotencia para el reintento. Vuelve a intentarlo.',
  INVALID_IDEMPOTENCY_KEY: 'La clave de idempotencia generada no es válida. Vuelve a intentarlo.',
  IDEMPOTENCY_CONFLICT: 'Ya hay un reintento distinto en curso para este target con la misma clave. Espera a que finalice.',
  UNSUPPORTED_PACKAGE_MANAGER: 'El Sandbox requiere pnpm y pnpm-lock.yaml; el proyecto no cumple esta condición.',
}

export function runErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && messages[error.code]) return messages[error.code]
  if (error instanceof Error) return error.message
  return 'No fue posible procesar esta operación del run.'
}
