import { ApiError } from '../api/client'

/** HU30/HU56/HU57/HU64: mensajes de dominio por `ApiError.code` de las rutas de binding y de Project (INTEROP-2.4 §6.1/§6.8/§6.13). */
const codeMessages: Record<string, string> = {
  REPOSITORY_ALREADY_BOUND: 'Este repositorio ya está vinculado a otro proyecto. Elige otro repositorio.',
  REPOSITORY_BINDING_ALREADY_EXISTS: 'Este proyecto ya tiene un repositorio vinculado.',
  REPOSITORY_BINDING_NOT_FOUND: 'Este proyecto no tiene un repositorio vinculado.',
  // Un solo caso a propósito (INTEROP-2.4 §6.8): repositorio inexistente, id falso o sin ningún permiso responden lo mismo y no se distinguen.
  GITHUB_REPOSITORY_NOT_FOUND: 'No encontramos ese repositorio o no tienes permiso sobre él. Vuelve a elegirlo de la lista.',
  REPOSITORY_OUTSIDE_WORKSPACE: 'Este repositorio no pertenece a tu cuenta; en un proyecto personal solo puedes vincular repositorios propios.',
  REPOSITORY_PERMISSION_INSUFFICIENT: 'Necesitas permiso maintain, write o admin sobre este repositorio.',
  // 401 de discovery (INTEROP §6.8): habla del token OAuth de GitHub, no de la sesión de la Console; la acción es «Renovar acceso a GitHub».
  GITHUB_ACCOUNT_REQUIRED: 'Tu acceso a GitHub no está disponible o expiró. Renuévalo para descubrir tus repositorios.',
  GITHUB_USER_TOKEN_INVALID: 'Tu acceso a GitHub no está disponible o expiró. Renuévalo para descubrir tus repositorios.',
  // Reintentable: no afirma que el repositorio no exista ni que falte el permiso.
  GITHUB_VERIFICATION_UNAVAILABLE: 'No pudimos verificar el permiso en GitHub ahora; inténtalo de nuevo.',
  GITHUB_APP_ACCESS_REQUIRED: 'La GitHub App no tiene acceso al repositorio. Configura el acceso en GitHub y vuelve a intentarlo.',
  PROJECT_NOT_FOUND: 'El proyecto ya no existe.',
  WORKSPACE_NOT_FOUND: 'Ese workspace ya no está disponible. Actualiza la lista de workspaces y vuelve a elegirlo.',
  WORKSPACE_ADMIN_REQUIRED: 'Solo un owner activo de la organización puede crear Projects en ese workspace.',
}

const serverErrorMessage = 'RAG Core no pudo completar la operación. Inténtalo de nuevo en unos minutos.'

export function bindingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PROJECT_ROLE_INSUFFICIENT') {
      const details = error.details as { requiredRole?: unknown; currentRole?: unknown } | null
      if (typeof details?.requiredRole === 'string' && typeof details.currentRole === 'string') {
        return `Tu rol actual (${details.currentRole}) no alcanza para esta acción; se requiere ${details.requiredRole}.`
      }
      return 'Tu rol actual no permite esta acción en el Project.'
    }
    if (error.code && codeMessages[error.code]) return codeMessages[error.code]
    if (error.status >= 500) return serverErrorMessage
  }
  return error instanceof Error && error.message ? error.message : serverErrorMessage
}

/**
 * Reactivar (HU57) no permite revincular otro repositorio: «Vuelve a elegirlo de la lista» no aplica. Si Core revalida `repositoryId`
 * (404) o propietario (400) y fallan, el binding sigue REVOKED y el único camino es un proyecto nuevo (INTEROP-2.4 §6.8).
 */
const reactivateUnavailableMessage = 'El repositorio ya no está disponible para este proyecto; si necesitas otro, elimina el proyecto y crea uno nuevo.'

export function reactivateErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.code === 'GITHUB_REPOSITORY_NOT_FOUND' || error.code === 'REPOSITORY_OUTSIDE_WORKSPACE')) return reactivateUnavailableMessage
  return bindingErrorMessage(error)
}

/** `401 GITHUB_ACCOUNT_REQUIRED`/`GITHUB_USER_TOKEN_INVALID` en discovery: no cierran la sesión; se resuelven con «Renovar acceso a GitHub». */
export function isGitHubAccessRenewalRequired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && (error.code === 'GITHUB_ACCOUNT_REQUIRED' || error.code === 'GITHUB_USER_TOKEN_INVALID')
}

/** HU64 (INTEROP-2.4 §6.13): GitHub no permitió verificar el permiso o la instalación; reintentar tiene sentido y no implica ningún juicio sobre el repositorio. */
export function isVerificationUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503 && error.code === 'GITHUB_VERIFICATION_UNAVAILABLE'
}

/** Referencia para soporte: solo existe en errores que vinieron de Core (o del mock) con `correlationId`. */
export function errorCorrelationId(error: unknown): string | undefined {
  return error instanceof ApiError ? error.correlationId : undefined
}

/** Un Project borrado (o ajeno) responde 404 `PROJECT_NOT_FOUND`: no es un fallo transitorio, así que no tiene sentido ofrecer "Reintentar". */
export function isProjectNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404 && error.code === 'PROJECT_NOT_FOUND'
}
