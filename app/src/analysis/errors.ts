import { ApiError } from '../api/client'

const messages: Record<string, string> = {
  INVALID_ZIP: 'El archivo no es un ZIP válido o está dañado.',
  ZIP_TOO_LARGE: 'El archivo supera el tamaño permitido por RAG Core.',
  UNSUPPORTED_PROJECT: 'No se detectó un proyecto TypeScript compatible.',
  EMPTY_PROJECT: 'El ZIP no contiene archivos analizables.',
}

export function analysisErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && messages[error.code]) return messages[error.code]
  if (error instanceof Error) return error.message
  return 'No fue posible procesar esta versión.'
}
