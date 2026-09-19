import { ApiError } from '../api/client'

const messages: Record<string, string> = {
  CONTEXT_TRACE_NOT_FINISHED: 'La traza de contexto todavía no está disponible; el run o experimento no llegó a un estado terminal.',
  CONTEXT_TRACE_NOT_FOUND: 'No encontramos esta traza de contexto o no tienes acceso a ella.',
}

export function contextTraceErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && messages[error.code]) return messages[error.code]
  if (error instanceof Error) return error.message
  return 'No fue posible cargar el contexto de esta generación.'
}

export function isContextTraceNotFinished(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'CONTEXT_TRACE_NOT_FINISHED'
}
