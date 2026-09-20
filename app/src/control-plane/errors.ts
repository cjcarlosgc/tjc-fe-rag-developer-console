import { ApiError } from '../api/client'

/** HU30/HU56/HU57: mensajes de dominio por `ApiError.code` de las rutas de binding y de Project (INTEROP-2.3 §6.1/§6.8). */
const codeMessages: Record<string, string> = {
  REPOSITORY_ALREADY_BOUND: 'Este repositorio ya está vinculado a otro proyecto. Elige otro repositorio.',
  REPOSITORY_BINDING_ALREADY_EXISTS: 'Este proyecto ya tiene un repositorio vinculado.',
  REPOSITORY_BINDING_NOT_FOUND: 'Este proyecto no tiene un repositorio vinculado.',
  GITHUB_REPOSITORY_NOT_FOUND: 'No encontramos ese repositorio en GitHub con el identificador enviado. Vuelve a elegirlo de la lista.',
  GITHUB_APP_ACCESS_REQUIRED: 'La GitHub App no tiene acceso al repositorio. Configura el acceso en GitHub y vuelve a intentarlo.',
  PROJECT_NOT_FOUND: 'El proyecto ya no existe.',
}

const serverErrorMessage = 'RAG Core no pudo completar la operación. Inténtalo de nuevo en unos minutos.'

export function bindingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && codeMessages[error.code]) return codeMessages[error.code]
    if (error.status >= 500) return serverErrorMessage
  }
  return error instanceof Error && error.message ? error.message : serverErrorMessage
}

/** Referencia para soporte: solo existe en errores que vinieron de Core (o del mock) con `correlationId`. */
export function errorCorrelationId(error: unknown): string | undefined {
  return error instanceof ApiError ? error.correlationId : undefined
}

/** Un Project borrado (o ajeno) responde 404 `PROJECT_NOT_FOUND`: no es un fallo transitorio, así que no tiene sentido ofrecer "Reintentar". */
export function isProjectNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404 && error.code === 'PROJECT_NOT_FOUND'
}
